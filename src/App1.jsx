import React from "../core/react";

const { useState, useEffect } = React;

function Counter({ num }) {
  return <div>count: {num}</div>;
}

function Foo() {
  console.log("Foo");

  const [foo, setFoo] = useState(0);
  const [bar, setBar] = useState("bar");

  useEffect(() => {
    console.log("init");
    return () => {
      console.log("cleanup init");
    };
  }, []);

  useEffect(() => {
    console.log("update foo", foo);
    return () => {
      console.log("cleanup foo", foo);
    };
  }, [foo]);

  useEffect(() => {
    console.log("update foo", foo, "bar", bar);
    return () => {
      console.log("cleanup foo", foo, "bar", bar);
    };
  }, [foo, bar]);

  const handleClickFoo = () => {
    setFoo(foo + 1);
  };

  const handleClickBar = () => {
    setBar(bar + "bar");
  };

  return (
    <div>
      Foo1
      <div>{foo}</div>
      <div>{bar}</div>
      <button onClick={handleClickFoo}>click foo</button>
      <button onClick={handleClickBar}>click bar</button>
    </div>
  );
}

function Bar() {
  console.log("Bar");

  const [bar, setBar] = useState(0);
  const handleClick = () => {
    setBar(bar + 1);
  };

  return (
    <div>
      Bar1
      <div>{bar}</div>
      <button onClick={handleClick}>click</button>
    </div>
  );
}

function CounterContainer({ num }) {
  console.log("CounterContainer");

  const [count, setCount] = useState(num);
  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <>
      <div>
        <Counter num={count}></Counter>
        <button onClick={handleClick}>click</button>
      </div>
      <Foo></Foo>
      <Bar></Bar>
    </>
  );
}

function App() {
  return (
    <div>
      hi! light-react
      <Counter num={10}></Counter>
      <Counter num={20}></Counter>
      <CounterContainer num={30}></CounterContainer>
    </div>
  );
}

export default App;
