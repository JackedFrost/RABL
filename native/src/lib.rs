use neon::prelude::*;
use core::panic;
use std::{
    error::Error,
    str::from_utf8,
    net::TcpStream, 
    io::{Read, Write}
};

fn login(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let username = cx.argument::<JsString>(0)?.value();
    let password = cx.argument::<JsString>(1)?.value();
    
    let mut stream = establish_connection();
    // We are creating a String, by using .join() on an array of &str, seperated by ".", we then want this message in the form of a 'byte slice'
    let login_builder = ["login", &username, &password].join(".");
    let login_payload = login_builder.as_bytes();
    println!("Connecting to Rabl Server...");

    if let Err(err) = stream.write(login_payload) {
        panic!(&err.to_string());
    }
    println!("Sent login request...");

    // 16 byte buffer pre-allocation, response should not exceed 16 bytes
    let mut incoming_data = [0 as u8; 16];
    let data_size = stream.read(&mut incoming_data).unwrap();
    println!("{:?}", incoming_data);
    let response = from_utf8(&incoming_data[0..data_size]).unwrap();

    println!("Response received...{} ", response);

    if response == "login.grant" {
        println!("Login successful!");
        Ok(cx.boolean(true))
    } else {
        Ok(cx.boolean(false))
    }
}

fn send_message(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    // First determine arguments
    let sender = cx.argument::<JsString>(0)?.value();
    let target = cx.argument::<JsString>(1)?.value();
    let message = cx.argument::<JsString>(2)?.value();

    // Arguments good - begin connection
    // panic! is going throw our errors up to be handled by the JavaScript
    let mut stream = establish_connection();
    let payload = ["msg.", &sender, ".", &target, ".", &message].concat();
    if let Err(stream_write_error) = stream.write(payload.as_bytes()) {
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

struct Message {
    sender: String,
    target: String,
    content: String,
}

struct MessageQueue {
    messages: Vec<Message>,
}

// Internal lib function to establish a connection
fn establish_connection() -> TcpStream {
    match TcpStream::connect("64.227.87.184:5050") {
        Ok(stream) => {
            stream
        },
        Err(e) => panic!(&e.to_string())
    }
}

fn poll_messages(mut cx:FunctionContext) -> JsResult<JsObject> {
    let user = cx.argument::<JsString>(0)?.value();
    let mut stream = establish_connection();

    let payload = ["poll.", &user].concat();

    if let Err(e) = stream.write(payload.as_bytes()) {
        panic!(&e.to_string())
    }

    let mut buffer = vec![];
    
    match stream.read(&mut buffer) {
        Ok(_) => {
            println!("{:?}", buffer);
            let mut message_vec = vec![];
            let mut cursor = 0;
            for (i, b) in buffer.iter().enumerate() {
                if b == &31 {
                    let message = buffer[cursor..=i].to_owned();
                    message_vec.push(message);
                    cursor = i+1;
                }
            }

            let mut msg_str = String::new();
            for message in message_vec {
                msg_str.push_str(from_utf8(&message).expect(""));
            }

            let jmsg_str = cx.string(msg_str);
            
            let jmsg_object = JsObject::new(&mut cx);
            jmsg_object.set(&mut cx, "message", jmsg_str).unwrap();

            return Ok(jmsg_object);

        }, 
        Err(e) => panic!(&e.to_string())
    }
}