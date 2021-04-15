use std::{fs::{File, OpenOptions}, io::{Read, Write}, net::TcpStream, str::from_utf8};
use std::{error::Error, fmt};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct User {
  pub username: String,
  pub password: String
  //last_login: Time,
}

#[derive(Debug)]
pub struct Message {
    pub source: String,
    pub content: String
}

impl PartialEq for Message {
  fn eq(&self, other: &Self) -> bool {
    (self.source == other.source) && (self.content == other.content)
  }
}

#[derive(Debug)]
struct RablParseError {
  error: String
}

impl RablParseError {
  fn new(msg: &str) -> RablParseError {
    RablParseError { error: msg.to_string() }
  }
}

impl fmt::Display for RablParseError {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f,"{}",self.error)
  }
}

impl Error for RablParseError {
  fn description(&self) -> &str {
    &self.error
  }
}

struct NetBuffer { 
  buffer: [u8; 4096],
  len: usize
}
/*
impl NetBuffer {
  fn split_by_unit(&self) -> Vec<String> {
    let v: Vec<u8> = Vec::new();
    for (i, byte) in self.buffer.iter().enumerate() {
      if byte == &31 || byte == &23 {

      } 
    }

    (str_one, str_two)
  }

  fn from(&self, payload: &[u8]) {}
}

// For easy displaying
// TODO: convert to utf8 first for even easier displaying
impl<T: Integer + fmt::Debug> fmt::Debug for NetBuffer<T> {
  fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
    self.buffer[..].fmt(formatter)
  }
}
*/

pub fn get_file(path: &str) -> Result<File, Box<dyn Error>> { 
  // Attempt to open the file - if this fails, the file probably doesn't exist. Make it.
  match OpenOptions::new().write(true).create(true).open(path) {
    Ok(f) => Ok(f),
    Err(e) => (Err(Box::new(e)))
  }
}
// Internal lib function to establish a connection
fn establish_connection() -> Result<TcpStream, Box<dyn Error>> {
    match TcpStream::connect("64.227.87.184:5050") {
        Ok(stream) => {
            Ok(stream)
        },
        Err(e) => Err(Box::new(e))
    }
}

// Take in a series of Strings and build a server request using specific sep characters
pub fn build_payload(components: Vec<String>) -> Vec<u8> {
    let mut payload: Vec<u8> = vec![];
    for (i, c) in components.iter().enumerate() {
        let mut x = c.clone().into_bytes();
        payload.append(&mut x);
        if i == components.len() - 1 {
            // End of payload
            payload.push(23);
        } else {
            // End of payload unit
            payload.push(31);
        }
    }
    payload
}

pub fn login(username: String, password: String) -> Result<bool, Box<dyn Error>> {
  let payload = build_payload(vec!["login".to_string(), username, password.clone()]);
  println!("sending {:?}", payload);

  // Establish connection and write the payload
  let mut stream = establish_connection().unwrap();
  if let Err(err) = stream.write(&payload) {
      panic!("{}", &err.to_string());
  }

    // 128 byte buffer - though this is likely overkill
  let mut incoming_data = [0 as u8; 128];
  let data_size = stream.read(&mut incoming_data).unwrap();
  let response = from_utf8(&incoming_data[0..data_size]).unwrap();

  println!("{:?}", response);

  let mut qualified_username = String::new();
  for (i, b) in incoming_data.iter().enumerate() {
    if b == &23 {

      let mut c: &u8 = &0;
      let mut j: usize = i;
      while c != &31 {
        c = &incoming_data[j];
        j -= 1;
      }

      qualified_username = from_utf8(&incoming_data[j+2..i]).unwrap().to_owned();
    }
  }

  serialize(qualified_username.to_owned(), password);
  // this will ensure the username data we query SQL for is sent back to us in the proper capitalization
  // as currently, logging in with 'admin' will login you in as *'Admin'*, but the client will continue
  // to send server requests with 'admin'
  Ok(true) 
  /*if response == "login.grant" {
      Ok(true)
  } else {
      Ok(false)
  }*/  
}

pub fn serialize(username: String, password: String) {
  let user = User { username, password };
  let file = OpenOptions::new().write(true).append(false).create(true).open("usr/userdat.cbor").unwrap();
  match serde_cbor::to_writer(file, &user) {
    Ok(_) => println!("User login cached. TODO: Allow a user to disable this"),
    Err(e) => eprintln!("Error writing serialized user data to file {}", e)
  } 
}

pub fn send_message(sender: String, target: String, message: String) -> Result<(), Box<dyn Error>>{
  let payload = build_payload(vec!["msg".to_string(), sender, target, message]);

  // Arguments good - begin connection
  // panic! is going to propogate our errors up to be handled by the JavaScript
  let mut stream = establish_connection()?;
  stream.write(&payload)?;

  Ok(())
}

// If successful, returns Some(Vec of messages)
pub fn poll_messages(username: String) -> Result<Option<Vec<Message>>, Box<dyn Error>> {
  let mut stream = establish_connection()?;
  let payload = build_payload(vec!["poll".to_string(), username]);

  stream.write(&payload)?;

  // Create the buffer, currently 32_768 bytes
  // we then 'read' into the buffer, filling it with whatever the server sends us
  let mut buffer = [0 as u8; 32_768];
  stream.read(&mut buffer)?;

  // Now we need to take that buffer and make an vec of messages, assuming the server did not respond with nil
  // First, check to see if buffer contains 'nil', if so simply return None
  // Otherwise, we build the vec from the buffer contents
  match &buffer[0..2] {
    b"nil" => {
      Ok(None)
    },
    _ => {
      // Great! Buffer is not nil
      let mut messages: Vec<Message> = Vec::new(); 

      // Cursor - A sort of index - used to keep track of which part of the buffer we are at to aid in slicing
      let mut cursor = 0;
      for (i, c) in buffer.iter().enumerate() {

        // If c is either the end of a source:msg block or end of the returned data
        if c == &29 || c == &23 {
          // We will create a new sub-slice from the beginning of our cursor to the current index
          // This will effectively create a sub slice, of each source:msg block
          let slice = &buffer[cursor..i].to_owned();

          for (j, x) in slice.iter().enumerate() {
            // Now we iterate the sub slice, looking for the ascii-31, which we use to seperate source from msg
            if x == &31 {
              // Attempt to parse the source and message from bytes to utf-8
              match (from_utf8(&slice[0..j]), from_utf8(&slice[j+1..slice.len()])) {
                (Ok(source), Ok(message)) => {
                  messages.push(Message { source: source.to_string(), content: message.to_string() } )
                },
                _ => return Err(Box::new(RablParseError::new("Failed to parse in poll_messages")))
              }  
            }
          }

          // Advance our cursor to the outer-loop index+1 (Moves us to the next source:msg block)
          cursor = i+1;
        }
      }

      Ok(Some(messages))
    }
  }
}

pub fn poll_friends(username: String) -> Result<Vec<String>, Box<dyn Error>> {
  let mut stream = establish_connection()?;
  let payload = build_payload(vec!["pollfriends".to_string(), username]);

  stream.write(&payload)?;
  let mut buffer = [0 as u8; 4096];
  let _data_len = stream.read(&mut buffer)?;

  let mut friends_list: Vec<String> = Vec::new();
  let mut cursor: usize = 0;
  for (i, char) in buffer.iter().enumerate() {
    if char == &31 || char == &23 {
      let utf_str = from_utf8(&buffer[cursor..i])?;
      friends_list.push(utf_str.to_owned());
      cursor = i+1;
    }
  } 
  
  Ok(friends_list)
}
