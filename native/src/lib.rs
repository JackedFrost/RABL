#![allow(non_snake_case)]

use neon::prelude::*;
use core::panic;
use std::{collections::HashMap, io::{Read, Write}, net::TcpStream, str::from_utf8};
use std::{error::Error, fmt};
// Take in a series of Strings and build a server request using specific sep characters
fn build_payload(components: Vec<String>) -> Vec<u8> {
    let mut payload: Vec<u8> = vec![];
    for (i, c) in components.iter().enumerate() {
        let mut x = c.clone().into_bytes();
        payload.append(&mut x);
        if i == components.len() - 1 {
            // End of payload
            payload.push(31);
        } else {
            // End of payload unit
            payload.push(29);
        }
    }
    payload
}

fn login(username: String, password: String) -> Result<bool, Box<dyn Error>> {
  let payload = build_payload(vec!["login".to_string(), username, password]);
  // Establish connection and write the payload
  let mut stream = establish_connection().unwrap();
  if let Err(err) = stream.write(&payload) {
      panic!("{}", &err.to_string());
  }

    // 16 byte buffer
    let mut incoming_data = [0 as u8; 16];
    let data_size = stream.read(&mut incoming_data).unwrap();
    let response = from_utf8(&incoming_data[0..data_size]).unwrap();

  if response == "login.grant" {
      println!("Login successful!");
      Ok(true)
  } else {
      Ok(false)
  }
  
}

fn login_clicked(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    // Building the login request - 29 seperating header information, 31 declaring end of data
    let username = cx.argument::<JsString>(0)?.value();
    let password = cx.argument::<JsString>(1)?.value();

    match login(username, password) {
      Ok(success) => {
        Ok(cx.boolean(success))
      }
      Err(login_err) => {
        panic!("{}", login_err) 
      }
    }
}

fn send_message(sender: String, target: String, message: String) -> Result<(), Box<dyn Error>>{
  let payload = build_payload(vec!["msg".to_string(), sender, target, message]);

  // Arguments good - begin connection
  // panic! is going to propogate our errors up to be handled by the JavaScript
  let mut stream = establish_connection()?;
  stream.write(&payload)?;

  Ok(())
}

fn send_message_clicked(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    // Gathering parameters from JavaScript
    let sender = cx.argument::<JsString>(0)?.value();
    let target = cx.argument::<JsString>(1)?.value();
    let message = cx.argument::<JsString>(2)?.value();
    send_message(sender, target, message).unwrap();
    Ok(cx.undefined())
}

register_module!(mut cx, {
    cx.export_function("login", login_clicked)?;
    cx.export_function("send_message", send_message_clicked)?;
    cx.export_function("poll_messages", poll_messages_clicked)?;
    Ok(())
});

// Internal lib function to establish a connection
fn establish_connection() -> Result<TcpStream, Box<dyn Error>> {
    match TcpStream::connect("64.227.87.184:5050") {
        Ok(stream) => {
            Ok(stream)
        },
        Err(e) => Err(Box::new(e))
    }
}
#[derive(Debug)]
struct MessageBlob {
    blob: HashMap<String, Vec<Message>>
}

#[derive(Debug)]
struct Message {
    source: String,
    content: String
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

// If successful, returns Some(Vec of messages)
fn poll_messages(username: String) -> Result<Option<Vec<Message>>, Box<dyn Error>> {
  let mut stream = establish_connection()?;
  let payload = build_payload(vec!["poll".to_string(), username]);

  stream.write(&payload)?;

  // Create the buffer, currently 128 bytes
  // we then 'read' into the buffer, filling it with whatever the server sends us
  let mut buffer = [0 as u8; 128];
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

fn poll_messages_clicked(mut cx:FunctionContext) -> JsResult<JsArray> {
  let user = cx.argument::<JsString>(0)?.value();

  // Use internal function to get (potentially) a vector of messages
  match poll_messages(user).unwrap() {
    Some(messages) => {
      // Initialize a new JS array, notice the CamelCase for JS objects/vars
      let JsMessageArray = JsArray::new(&mut cx, messages.len() as u32);

      // iterate (enumerate) the (Rust) vector of messages, and map each message to our JS array
      // by creating new JSON objects for each entry in the vector
      for (i, message) in messages.iter().enumerate() { 
        let JsMessageObject = JsObject::new(&mut cx);
        let source = cx.string(message.source.clone());
        let content = cx.string(message.content.clone());

        JsMessageObject.set(&mut cx, "Source", source)?;
        JsMessageObject.set(&mut cx, "Content", content)?;

        // Set the newly created JSON Message object into the array
        JsMessageArray.set(&mut cx, i as u32, JsMessageObject).unwrap();
      }
      // Return the array
      Ok(JsMessageArray)
    },
    None => {
      // Return an empty array, as there are no messages
      Ok(cx.empty_array())
    }
  }
}


// These tests are UGLY! But they work for now
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_login() {
    assert_eq!(login("test".to_owned(), "test".to_owned()).unwrap(), true);
  }

  #[test]
  fn test_messaging() {
    send_message("test".to_string(), "test".to_string(), "hello".to_string()).unwrap();
    let empty_messages = vec![Message {source:"test".to_string(),content:"hello".to_string()}];
    assert_eq!(poll_messages("test".to_string()).unwrap().expect("").get(0).expect(":w"), empty_messages.get(0).expect(""));
  }
}
