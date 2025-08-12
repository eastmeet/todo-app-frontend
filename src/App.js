import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8080/api/v1/todo';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchTodos();
  }, []);

  // SSE 연결 설정
  useEffect(() => {
    let eventSource;
    let reconnectTimeout;
    
    const connectSSE = () => {
      console.log('SSE 연결 시도 중...');
      eventSource = new EventSource('http://localhost:8080/api/v1/notifications/stream');
      
      // 연결 열림 이벤트
      eventSource.onopen = (event) => {
        console.log('SSE 연결 성공!');
        console.log('readyState:', eventSource.readyState);
      };
      
      // 기본 onmessage 핸들러 (이름 없는 이벤트용)
      eventSource.onmessage = (event) => {
        console.log('기본 메시지 수신:', event.data);
      };
      
      // 'message' 이벤트 리스너
      eventSource.addEventListener('message', (event) => {
        console.log('message 이벤트 수신:', event.data);
        try {
          const notification = JSON.parse(event.data);
          const notificationId = Date.now();
          const newNotification = { 
            id: notificationId, 
            message: notification.message, 
            timestamp: new Date(),
            read: false 
          };
          setNotifications(prev => [...prev, newNotification]);
          setUnreadCount(prev => prev + 1);
        } catch (error) {
          console.error('알림 파싱 오류:', error);
        }
      });
      
      // 'connect' 이벤트 리스너
      eventSource.addEventListener('connect', (event) => {
        console.log('connect 이벤트 수신:', event.data);
      });
      
      eventSource.onerror = (error) => {
        console.error('SSE 연결 오류 발생');
        console.error('readyState:', eventSource.readyState);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('연결이 닫혔습니다. 5초 후 재연결 시도...');
          eventSource.close();
          
          // 5초 후 재연결
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 5000);
        }
      };
    };
    
    connectSSE();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
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

  // 에러 테스트 함수 추가
  const triggerError = async () => {
    try {
      await axios.get(`${API_URL}/error`);
    } catch (error) {
      console.error('의도적인 에러 발생:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // 알림을 열 때 모두 읽음 처리
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <h1>Todo 애플리케이션</h1>
          <div className="notification-bell-container">
            <button 
              className="notification-bell"
              onClick={handleNotificationClick}
            >
              <span className="bell-icon">🔔</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h3>알림</h3>
                  <button 
                    onClick={() => setNotifications([])}
                    className="clear-all-btn"
                  >
                    모두 지우기
                  </button>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">새로운 알림이 없습니다</p>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      >
                        <div className="notification-content">
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <button 
                          onClick={() => removeNotification(notification.id)}
                          className="notification-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
          <button type="button" onClick={triggerError} className="error-button">Error 발생</button>
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