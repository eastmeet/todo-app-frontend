// ===== React 컴포넌트 수정 부분 =====

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8080/api/v1/todo';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(API_URL);
      setTodos(response.data);
    } catch (error) {
      console.error('Todo를 가져오는 중 오류 발생:', error);
    }
  };

  const createTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      const response = await axios.post(API_URL, newTodo);
      setTodos([...todos, response.data]);
      setNewTodo({ title: '', description: '' });
    } catch (error) {
      console.error('Todo 생성 중 오류 발생:', error);
    }
  };

  // 수정된 부분: isComplete 필드를 사용하도록 변경
  const toggleTodo = async (id, todo) => {
    try {
      // 백엔드에서 isComplete 필드를 사용한다면
      const updatedTodo = { ...todo, isComplete: !todo.isComplete };
      const response = await axios.put(`${API_URL}/${id}`, updatedTodo);
      setTodos(todos.map(t => t.id === id ? response.data : t));
    } catch (error) {
      console.error('Todo 업데이트 중 오류 발생:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Todo 삭제 중 오류 발생:', error);
    }
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>Todo 애플리케이션</h1>

          <form onSubmit={createTodo} className="todo-form">
            <input
                type="text"
                placeholder="할 일 제목"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="todo-input"
            />
            <input
                type="text"
                placeholder="설명 (선택사항)"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="todo-input"
            />
            <button type="submit" className="add-button">추가</button>
          </form>

          {/* 수정된 부분: isComplete 필드 사용 및 completed 클래스 적용 */}
          <div className="todo-list">
            {todos.map(todo => (
                <div key={todo.id} className={`todo-item ${todo.isComplete ? 'completed' : ''}`}>
                  <div className="todo-content">
                    <h3 className={todo.isComplete ? 'completed-text' : ''}>{todo.title}</h3>
                    {todo.description && (
                        <p className={todo.isComplete ? 'completed-text' : ''}>{todo.description}</p>
                    )}
                  </div>
                  <div className="todo-actions">
                    <button
                        onClick={() => toggleTodo(todo.id, todo)}
                        className={`toggle-button ${todo.isComplete ? 'completed-button' : 'incomplete-button'}`}
                    >
                      {todo.isComplete ? '완료 취소' : '완료'}
                    </button>
                    <button
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
            ))}
          </div>

          {todos.length === 0 && (
              <p className="empty-message">아직 할 일이 없습니다. 새로운 할 일을 추가해보세요!</p>
          )}
        </header>
      </div>
  );
}

export default App;