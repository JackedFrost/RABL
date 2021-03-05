use neon::prelude::*;
use std::{
    str::from_utf8,
    net::TcpStream, 
    io::{Read, Write}
};

fn login(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let username = cx.argument::<JsString>(0)?.value();
    let password = cx.argument::<JsString>(1)?.value();
    
    let mut stream = TcpStream::connect("64.227.87.184:5050").unwrap();
    // We are creating a String, by using .join() on an array of &str, seperated by ".", we then want this message in the form of a 'byte slice'
    let login_builder = ["login", &username, &password].join(".");
    let login_payload = login_builder.as_bytes();
    println!("Connecting to Rabl Server...");

    match stream.write(login_payload) {
        Ok(e) => {
            return Ok(cx.boolean(true))
        }
        Err(e) => {
            println!("ERROR E");
            return Ok(cx.boolean(false))
        }
    };
    println!("Sent login request...");

    // 16 byte buffer pre-allocation, response should not exceed 16 bytes
    let mut incoming_data = [0 as u8; 16];
    let data_size = stream.read(&mut incoming_data).unwrap();
    println!("{:?}", incoming_data);
    let response = from_utf8(&incoming_data[0..data_size]).unwrap();

    println!("Response received...{} ", response);

    if response == "login.grant" {
        //match login_cache(usr) {
        //    Ok(_) => println!("Wrote user cache"),
        //    Err(_) => println!("Failed to write user cache"),
        //}

        // Regardless if the cache wrote or not, we were still able to login.
        println!("Login successful!");
        Ok(cx.boolean(true))
    } else {
        Ok(cx.boolean(false))
    }
}

register_module!(mut cx, {
    cx.export_function("login", login)
});
