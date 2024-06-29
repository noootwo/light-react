import React, { useEffect, useState } from "../core/react";
import "./app.css";

function TodoItem({ todoItem, onDone, onDelete }) {
  return (
    <div>
      <span className={[todoItem.done ? "done" : ""]}>{todoItem.content}</span>
      <button onClick={onDone}>{todoItem.done ? "undo" : "done"}</button>
      <button onClick={onDelete}>delete</button>
    </div>
  );
}

function TodoList({ todoList, onChange }) {
  function handleDone(index) {
    todoList[index].done = !todoList[index].done;
    onChange([...todoList]);
  }

  function handleDelete(index) {
    todoList.splice(index, 1);
    onChange([...todoList]);
  }

  return (
    <div>
      {todoList.map((todoItem, index) => (
        <TodoItem
          todoItem={todoItem}
          onDone={() => handleDone(index)}
          onDelete={() => handleDelete(index)}
        ></TodoItem>
      ))}
    </div>
  );
}

function App() {
  const [todoList, setTodoList] = useState([]);
  useEffect(() => {
    const initTodoList = JSON.parse(localStorage.getItem("todoList")) || [];
    setTodoList(initTodoList);
  }, []);

  const [inputValue, setInputValue] = useState("");
  const handleAdd = () => {
    setTodoList([
      ...todoList,
      {
        content: inputValue,
        done: false,
      },
    ]);
    setInputValue("");
  };

  const [onlyDone, setOnlyDone] = useState(false);

  const handleCache = () => {
    localStorage.setItem("todoList", JSON.stringify(todoList));
  };

  const handleChange = (todoList) => {
    setTodoList(todoList);
  };

  const todoListToShow = onlyDone
    ? todoList.filter((todoItem) => todoItem.done)
    : todoList;

  return (
    <div>
      <h1>My todo</h1>
      <div>
        <input
          type="text"
          value={inputValue}
          onInput={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAdd();
            }
          }}
        ></input>
        <button onClick={handleAdd}>add</button>
      </div>
      <div>
        <button onClick={handleCache}>cache</button>

        <label htmlFor="onlyDone">
          <input
            id="onlyDone"
            type="checkbox"
            value={onlyDone}
            onChange={(e) => setOnlyDone(e.target.checked)}
          />
          only done
        </label>
      </div>
      <br />
      <TodoList todoList={todoListToShow} onChange={handleChange}></TodoList>
    </div>
  );
}

export default App;
