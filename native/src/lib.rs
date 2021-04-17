#![allow(non_snake_case)]

use neon::prelude::*;

mod client_core;
use crate::client_core::*;
use std::io::Write;
use std::fs::OpenOptions;
use std::io::Read;

register_module!(mut cx, {
    cx.export_function("login", login_clicked)?;
    cx.export_function("send_message", send_message_clicked)?;
    cx.export_function("poll_messages", poll_messages_clicked)?;
    cx.export_function("poll_friends", handle_poll_friends)?;
    cx.export_function("deserialize_login", deserialize_login)?;
    cx.export_function("purge_userdat", purge_userdat)?;
    cx.export_function("poll_servers", handle_poll_servers)?;
    cx.export_function("test_server_msg", test_server_msg)?;
    Ok(())
});

fn handle_poll_servers(mut cx: FunctionContext) -> JsResult<JsArray> {
  let username = cx.argument::<JsString>(0)?.value();

  match poll_servers(username) {
    Ok(result) => {
      match result {
        Some(servers) => {
          let JsServerArray = JsArray::new(&mut cx, servers.len() as u32);
        
          for (i, server) in servers.iter().enumerate() {
            let server = cx.string(server);
            JsServerArray.set(&mut cx, i as u32, server)?;
          }

          Ok(JsServerArray)
        },
        None => {
          Ok(cx.empty_array())
        }
      }
    },
    Err(poll_err) => {
      panic!("RABL_RUST ENCOUNTERED ERROR POLLING SERVER LIST: {}", poll_err)
    }
  }
}

fn purge_userdat(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let mut file = OpenOptions::new()
    .write(true)
    .truncate(true)
    .open("usr/userdat.cbor")
    .unwrap();
  file.write_all(b"").unwrap();
  Ok(cx.undefined())
}

fn deserialize_login(mut cx: FunctionContext) -> JsResult<JsObject> {
  let file = OpenOptions::new().read(true).open("usr/userdat.cbor").unwrap();
  let userdat: User = serde_cbor::from_reader(file).unwrap();

  let JsUser = JsObject::new(&mut cx);
  let username = cx.string(userdat.username);
  let password = cx.string(userdat.password);

  JsUser.set(&mut cx, "Username", username)?;
  JsUser.set(&mut cx, "Password", password)?;

  Ok(JsUser)
}

fn handle_poll_friends(mut cx: FunctionContext) -> JsResult<JsArray> {
  let username = cx.argument::<JsString>(0)?.value();

  let friends_list = poll_friends(username).expect("TODO");
  let JsFriendsList = JsArray::new(&mut cx, friends_list.len() as u32);
  for (i, friend) in friends_list.iter().enumerate() {
    let friend = cx.string(friend);
    JsFriendsList.set(&mut cx, i as u32, friend)?;
  }

  Ok(JsFriendsList)
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

fn test_server_msg(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let payload = build_payload(vec!["srvrmsg".to_owned(), "test".to_string(), "server_General".to_string(), "TESTING SRV".to_owned()]); 
  let mut connection = establish_connection().unwrap();
  let _ = connection.write(&payload).unwrap();
  let mut buff = [0 as u8; 256]; 
  connection.read(&mut buff).unwrap();

  println!("{:?}", buff);
  Ok(cx.undefined())
}

fn send_message_clicked(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    // Gathering parameters from JavaScript
    let sender = cx.argument::<JsString>(0)?.value();
    let target = cx.argument::<JsString>(1)?.value();
    let message = cx.argument::<JsString>(2)?.value();
    send_message(sender, target, message).unwrap();
    Ok(cx.undefined())
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
        let source = cx.string(message.source.clone());
        let content = cx.string(message.content.clone());

        if !message.is_dm {
          let server = cx.string(message.server.clone());
          let JsSrvrMessageObj = JsObject::new(&mut cx);
          JsSrvrMessageObj.set(&mut cx, "Server", server)?;
          JsSrvrMessageObj.set(&mut cx, "Source", source)?;
          JsSrvrMessageObj.set(&mut cx, "Content", content)?;

          JsMessageArray.set(&mut cx, i as u32, JsSrvrMessageObj)?;
        } else {
          let JsMessageObject = JsObject::new(&mut cx);
          JsMessageObject.set(&mut cx, "Source", source)?;
          JsMessageObject.set(&mut cx, "Content", content)?;

          // Set the newly created JSON Message object into the array
          JsMessageArray.set(&mut cx, i as u32, JsMessageObject)?;
        }

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

  #[test]
  fn test_friendslist() {
    let debug_vec = vec!["asdf".to_string(), "asdf".to_string()];
    assert_eq!(poll_friends("test".to_string()).unwrap(), debug_vec);
  }
}
