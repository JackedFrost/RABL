use neon::prelude::*;
use core::panic;
use std::{collections::{HashMap, hash_map::Keys}, io::{Read, Write}, net::TcpStream, str::from_utf8};

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

fn login(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    // Building the login request - 29 seperating header information, 31 declaring end of data
    let username = cx.argument::<JsString>(0)?.value();
    let password = cx.argument::<JsString>(1)?.value();
    let payload = build_payload(vec!["login".to_string(), username, password]);
    
    // Establish connection and write the payload
    let mut stream = establish_connection();
    if let Err(err) = stream.write(&payload) {
        panic!(&err.to_string());
    }

    // 16 byte buffer
    let mut incoming_data = [0 as u8; 16];
    let data_size = stream.read(&mut incoming_data).unwrap();
    let response = from_utf8(&incoming_data[0..data_size]).unwrap();

    if response == "login.grant" {
        println!("Login successful!");
        Ok(cx.boolean(true))
    } else {
        Ok(cx.boolean(false))
    }
}

fn send_message(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    // Gathering parameters from JavaScript
    let sender = cx.argument::<JsString>(0)?.value();
    let target = cx.argument::<JsString>(1)?.value();
    let message = cx.argument::<JsString>(2)?.value();
    let payload = build_payload(vec!["msg".to_string(), sender, target, message]);

    // Arguments good - begin connection
    // panic! is going to propogate our errors up to be handled by the JavaScript
    let mut stream = establish_connection();
    if let Err(stream_write_error) = stream.write(&payload) {
        panic!(&stream_write_error.to_string());
    }

    Ok(cx.undefined())
}

register_module!(mut cx, {
    cx.export_function("login", login)?;
    cx.export_function("send_message", send_message)?;
    cx.export_function("poll_messages", poll_messages)?;
    Ok(())
});

// Internal lib function to establish a connection
fn establish_connection() -> TcpStream {
    match TcpStream::connect("64.227.87.184:5050") {
        Ok(stream) => {
            stream
        },
        Err(e) => panic!(&e.to_string())
    }
}
#[derive(Debug)]
struct MessageBlob {
    blob: HashMap<String, Vec<Message>>
}


impl MessageBlob {
    fn new() -> MessageBlob {
        let blob = HashMap::new();
        MessageBlob {
            blob
        }
    }

    fn insert(&mut self, source: String, message: String) {
        match self.blob.get_mut(&source) {
            Some(msg_blob) => {
                msg_blob.push(Message { content: message , source });
            },
            None => {
                let new_queue = vec![Message { content: message , source: source.clone() }];
                self.blob.insert(source, new_queue);
            }
        }
    }

    fn get(&self) -> &HashMap<String, Vec<Message>> {
        &self.blob
    }

    fn get_messages(&self, key: &str) -> Option<&Vec<Message>> { self.blob.get(key) }
}
#[derive(Debug)]
struct Message {
    source: String,
    content: String
}

fn poll_messages(mut cx:FunctionContext) -> JsResult<JsObject> {
    let user = cx.argument::<JsString>(0)?.value();
    let mut stream = establish_connection();

    let payload = build_payload(vec!["poll".to_string(), user]);

    if let Err(e) = stream.write(&payload) {
        panic!(&e.to_string())
    }

    let mut buffer = [0 as u8; 64];
    match stream.read(&mut buffer) {
        Ok(_) => {
            let mut message_blob = MessageBlob::new();
            // Ah shit... here i go again parsing u8 arrays...
            let mut cursor = 0;
            for (i, c) in buffer.iter().enumerate() {
                // End of a source:message
                if c == &29 || c == &23 {
                    let slice = &buffer[cursor..i].to_owned();

                    for (j, x) in slice.iter().enumerate() {
                        if x == &31 {
                            match (from_utf8(&slice[0..j]), from_utf8(&slice[j+1..slice.len()])) {
                                (Ok(source), Ok(message)) => {
                                    message_blob.insert(source.to_owned(), message.to_owned());
                                },
                                _ => panic!("Error parsing utf8 from [Rust] #poll_messages (src or msg is ill formatted)")
                            }
                        }
                    }

                    cursor = i+1;
                }
            }

            // TODO: This needs to be re-written so that each source is a new JS object and msg_blob is an array of these objects
            // TODO: each object inside of msg_blob will hold an array as well as a source property
            // TODO: each array will hold a series of messages witha  source and content property
            let js_msg_blob = JsObject::new(&mut cx);
            for source in message_blob.get().keys() {
                let js_source = cx.string(source);
                js_msg_blob.set(&mut cx, "Source", js_source)?;

                match message_blob.get_messages(source) {
                    Some(messages) => {
                        let js_msg_array = JsArray::new(&mut cx, messages.len() as u32);
                        for (i, msg) in messages.iter().enumerate() {
                            let js_msg = JsObject::new(&mut cx);
                            let content = cx.string(msg.content.to_string());
        
                            js_msg.set(&mut cx, "Source", js_source)?;
                            js_msg.set(&mut cx, "Content", content)?;
                            js_msg_array.set(&mut cx, i as u32, js_msg)?;
                        }
                        js_msg_blob.set(&mut cx, "MessageQueue", js_msg_array)?;
                    },
                    None =>  {
                        let nil_msg_arr = JsArray::new(&mut cx, 0 as u32);
                        js_msg_blob.set(&mut cx, "MessageQueue", nil_msg_arr)?;
                    }
                }
            }

            Ok(js_msg_blob)
        }, 
        Err(e) => {
            panic!(&e.to_string());
        }
    }
}