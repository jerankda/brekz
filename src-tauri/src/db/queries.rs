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
    let now = chrono::Utc::now().to_rfc3339();
    let (sql, params): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = {
        let mut sets = Vec::new();
        let mut vals: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
        if let Some(t) = title {
            sets.push("title = ?");
            vals.push(Box::new(t.to_string()));
        }
        if let Some(m) = model {
            sets.push("model = ?");
            vals.push(Box::new(m.to_string()));
        }
        if let Some(s) = system_prompt {
            sets.push("system_prompt = ?");
            vals.push(Box::new(s.to_string()));
        }
        if sets.is_empty() {
            return Ok(());
        }
        sets.push("updated_at = ?");
        vals.push(Box::new(now));
        let sql = format!(
            "UPDATE conversations SET {} WHERE id = ?",
            sets.join(", ")
        );
        vals.push(Box::new(id.to_string()));
        (sql, vals)
    };
    let params_ref: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    conn.execute(&sql, params_ref.as_slice())
        .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn delete_conversation(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM conversations WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn insert_message(conn: &Connection, msg: &Message) -> Result<(), String> {
    conn.execute(
        "INSERT INTO messages (id, conversation_id, role, content, attachments, model, input_tokens, output_tokens, cost, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![msg.id, msg.conversation_id, msg.role, msg.content, msg.attachments, msg.model, msg.input_tokens, msg.output_tokens, msg.cost, msg.created_at],
    )
    .map_err(|e| format!("DB error: {}", e))?;
    Ok(())
}

pub fn list_messages(conn: &Connection, conversation_id: &str) -> Result<Vec<Message>, String> {
    let mut stmt = conn
        .prepare("SELECT id, conversation_id, role, content, attachments, model, input_tokens, output_tokens, cost, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| format!("DB error: {}", e))?;

    let rows = stmt
        .query_map(rusqlite::params![conversation_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                attachments: row.get(4)?,
                model: row.get(5)?,
                input_tokens: row.get(6)?,
                output_tokens: row.get(7)?,
                cost: row.get(8)?,
                created_at: row.get(9)?,
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

pub fn delete_all_conversations(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM messages", [])
        .map_err(|e| format!("DB error: {}", e))?;
    conn.execute("DELETE FROM conversations", [])
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