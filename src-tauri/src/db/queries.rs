use rusqlite::Connection;

use crate::openrouter::types::{Conversation, Message};

pub fn create_conversation(conn: &Connection, conv: &Conversation) -> Result<(), String> {
    conn.execute(
        "INSERT INTO conversations (id, title, model, system_prompt, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![conv.id, conv.title, conv.model, conv.system_prompt, conv.created_at, conv.updated_at],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn list_conversations(conn: &Connection) -> Result<Vec<Conversation>, String> {
    let mut stmt = conn
        .prepare("SELECT id, title, model, system_prompt, created_at, updated_at FROM conversations ORDER BY updated_at DESC")
        .map_err(|e| format!("DB error: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                model: row.get(2)?,
                system_prompt: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| format!("DB error: {}", e))?;

    let mut conversations = Vec::new();
    for row in rows {
        conversations.push(row.map_err(|e| format!("DB error: {}", e))?);
    }
    Ok(conversations)
}

pub fn get_conversation(conn: &Connection, id: &str) -> Result<Conversation, String> {
    conn.query_row(
        "SELECT id, title, model, system_prompt, created_at, updated_at FROM conversations WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(Conversation {
                id: row.get(0)?,
                title: row.get(1)?,
                model: row.get(2)?,
                system_prompt: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| format!("Conversation not found: {}", e))
}

pub fn update_conversation(
    conn: &Connection,
    id: &str,
    title: Option<&str>,
    model: Option<&str>,
    system_prompt: Option<&str>,
) -> Result<(), String> {
    if let Some(title) = title {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![title, now, id],
        )
        .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(model) = model {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE conversations SET model = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![model, now, id],
        )
        .map_err(|e| format!("DB error: {}", e))?;
    }
    if let Some(system_prompt) = system_prompt {
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE conversations SET system_prompt = ?1, updated_at = ?2 WHERE id = ?3",
            rusqlite::params![system_prompt, now, id],
        )
        .map_err(|e| format!("DB error: {}", e))?;
    }
    Ok(())
}

pub fn delete_conversation(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM messages WHERE conversation_id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    conn.execute(
        "DELETE FROM conversations WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn insert_message(conn: &Connection, msg: &Message) -> Result<(), String> {
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, model, input_tokens, output_tokens, cost, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![msg.id, msg.conversation_id, msg.role, msg.content, msg.model, msg.input_tokens, msg.output_tokens, msg.cost, msg.created_at],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn list_messages(conn: &Connection, conversation_id: &str) -> Result<Vec<Message>, String> {
    let mut stmt = conn
        .prepare("SELECT id, conversation_id, role, content, model, input_tokens, output_tokens, cost, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| format!("DB error: {}", e))?;

    let rows = stmt
        .query_map(rusqlite::params![conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                model: row.get(4)?,
                input_tokens: row.get(5)?,
                output_tokens: row.get(6)?,
                cost: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| format!("DB error: {}", e))?;

    let mut messages = Vec::new();
    for row in rows {
        messages.push(row.map_err(|e| format!("DB error: {}", e))?);
    }
    Ok(messages)
}

pub fn delete_message(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM messages WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn update_conversation_title(conn: &Connection, id: &str, title: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE conversations SET title = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![title, now, id],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}