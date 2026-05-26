use rusqlite::Connection;
use std::sync::Mutex;

pub mod init;
pub mod queries;

pub struct AppDatabase {
    pub conn: Mutex<Connection>,
}