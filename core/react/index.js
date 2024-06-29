const TEXT_NODE = "TEXT_NODE";

const createTextNode = (text) => {
  return {
    type: TEXT_NODE,
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode =
          !child || typeof child === "string" || typeof child === "number";
        return isTextNode ? createTextNode(child) : child;
      }),
    },
  };
};

let wipRoot;
let wipFiber;
let nextWorkOfUnit;
const deletions = [];
let stateHooks;
let stateHooksIndex = 0;
let effectHooks;
const workLoop = (deadline) => {
  let shouldYield = false;

  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);

    if (
      wipRoot?.sibling &&
      nextWorkOfUnit &&
      wipRoot.sibling.type === nextWorkOfUnit.type
    ) {
      nextWorkOfUnit = undefined;
    }

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextWorkOfUnit && wipRoot) {
    commitRoot();

    if (nextWorkOfUnit) wipRoot = nextWorkOfUnit;
  }

  requestIdleCallback(workLoop);
};

const commitRoot = () => {
  commitDeletions();
  commitWork(wipRoot.child);

  commitEffectHooks();

  wipRoot = null;
  deletions.length = 0;
};

const commitDeletions = () => deletions.forEach(commitDeletion);

const commitDeletion = (fiber) => {
  if (fiber.dom) {
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child);
  }
};

const commitWork = (fiber) => {
  if (!fiber) return;

  if (fiber.dom) {
    if (fiber.effectTag === "update") {
      updateProps(fiber.dom, fiber.props, fiber.alternate.props);
    } else if (fiber.effectTag === "placement") {
      let fiberParent = fiber.parent;
      while (!fiberParent.dom) {
        fiberParent = fiberParent.parent;
      }

      updateProps(fiber.dom, fiber.props, {});
      fiberParent.dom.appendChild(fiber.dom);
    }
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitEffectHooks = () => {
  const run = (fiber) => {
    if (!fiber) return;

    if (!fiber.alternate) {
      fiber.effectHooks?.forEach((hook) => {
        hook.cleanup = hook.callback();
      });
    } else {
      const oldEffectHooks = fiber.alternate.effectHooks;

      fiber.effectHooks?.forEach((newHook, hookIndex) => {
        if (newHook.deps.length > 0) {
          const oldEffectHook = oldEffectHooks[hookIndex];

          const depsChange = oldEffectHook?.deps.some(
            (oldDep, depIndex) => oldDep !== newHook.deps[depIndex]
          );
          if (depsChange) newHook.cleanup = newHook.callback();
        }
      });
    }

    run(fiber.child);
    run(fiber.sibling);
  };

  const runCleanup = (fiber) => {
    if (!fiber) return;

    fiber.alternate?.effectHooks?.forEach((hook) => {
      if (hook.deps.length > 0) {
        hook.cleanup && hook.cleanup();
      }
    });

    runCleanup(fiber.child);
    runCleanup(fiber.sibling);
  };

  runCleanup(wipRoot);
  run(wipRoot);
};

const createDom = (type) => {
  return type === TEXT_NODE
    ? document.createTextNode("")
    : document.createElement(type);
};

const updateProps = (dom, nextProps, prevProps) => {
  if (!dom || !nextProps) return;

  Object.keys(prevProps).forEach((key) => {
    if (key !== "children") {
      if (!(key in nextProps)) {
        dom.removeAttribute(key);
      }
    }
  });

  Object.keys(nextProps).forEach((key) => {
    if (nextProps[key] !== prevProps[key]) {
      if (key !== "children") {
        if (key.startsWith("on")) {
          const eventType = key.slice(2).toLowerCase();

          dom.removeEventListener(eventType, prevProps[key]);
          dom.addEventListener(eventType, nextProps[key]);
        } else {
          dom[key] = nextProps[key];
        }
      }
    }
  });
};

const reconcileChildren = (fiber, children) => {
  let prevChild = null,
    oldChild = fiber.alternate?.child;

  children.flat().forEach((child, index) => {
    const isSameType = oldChild && oldChild.type === child.type;

    let newFiber;

    if (isSameType) {
      newFiber = {
        ...oldChild,
        props: child.props,
        parent: fiber,
        sibling: null,
        child: null,
        effectTag: "update",
        alternate: oldChild,
      };
    } else {
      if (child) {
        newFiber = {
          type: child.type,
          props: child.props,
          dom: null,
          parent: fiber,
          sibling: null,
          child: null,
          effectTag: "placement",
        };
      }

      if (oldChild) deletions.push(oldChild);
    }

    if (oldChild) oldChild = oldChild.sibling;

    if (index == 0) {
      fiber.child = newFiber;
    } else if (prevChild) {
      prevChild.sibling = newFiber;
    }

    if (newFiber) prevChild = newFiber;
  });

  while (oldChild) {
    deletions.push(oldChild);
    oldChild = oldChild.sibling;
  }
};

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  stateHooks = [];
  stateHooksIndex = 0;
  effectHooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber) => {
  if (!fiber.dom && fiber.type) {
    const dom = (fiber.dom = createDom(fiber.type));

    // updateProps(dom, fiber.props, {});
  }

  fiber.props?.children && reconcileChildren(fiber, fiber.props.children);
};

const performWorkOfUnit = (fiber) => {
  const isFunctionComponent = typeof fiber.type === "function";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }

  if (fiber.sibling) {
    return fiber.sibling;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;

    nextFiber = nextFiber.parent;
  }

  return null;
};

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };

  nextWorkOfUnit = wipRoot;
};

const useState = (init) => {
  const currentFiber = wipFiber;
  const oldHook = currentFiber.alternate?.stateHooks?.[stateHooksIndex];
  const stateHook = oldHook ?? {
    state: init,
    queue: [],
  };

  stateHook.queue.forEach((action) => {
    stateHook.state = action(stateHook.state);
  });

  stateHooks[stateHooksIndex] = stateHook;
  currentFiber.stateHooks = stateHooks;
  stateHooksIndex++;

  const setState = (newState) => {
    const action = typeof newState === "function" ? newState : () => newState;
    const eagerState = action(stateHook.state);
    if (eagerState === stateHook.state) return;
    stateHook.queue.push(action);

    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };

    // 更新前一个 fiber 对当前 fiber 的引用
    let preFiber = currentFiber.parent?.child;
    if (preFiber === currentFiber) {
      currentFiber.parent.child = wipRoot;
    } else {
      while (preFiber && preFiber.sibling !== currentFiber) {
        preFiber = preFiber.sibling;
      }
      if (preFiber) preFiber.sibling = wipRoot;
    }

    nextWorkOfUnit = wipRoot;
  };

  return [stateHook.state, setState];
};

const useEffect = (callback, deps) => {
  const effectHook = {
    callback,
    deps,
    cleanup: undefined,
  };

  effectHooks.push(effectHook);

  wipFiber.effectHooks = effectHooks;
};

requestIdleCallback(workLoop);

const React = {
  useState,
  useEffect,
  render,
  createElement,
};

export default React;

export { useState, useEffect, render, createElement };
