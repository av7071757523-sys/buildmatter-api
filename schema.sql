SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo',
  assigned_to INT REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);