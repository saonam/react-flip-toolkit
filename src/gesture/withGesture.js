// edited from https://github.com/react-spring/react-use-gesture/blob/v4.0.7/index.js

import React, { Component } from 'react'
import PropTypes from 'prop-types'

const touchMove = 'touchmove'
const touchEnd = 'touchend'
const mouseMove = 'mousemove'
const mouseUp = 'mouseup'
const initialState = {
  event: undefined,
  args: undefined,
  temp: undefined,
  target: undefined,
  time: undefined,
  xy: [0, 0],
  delta: [0, 0],
  initial: [0, 0],
  previous: [0, 0],
  direction: [0, 0],
  local: [0, 0],
  lastLocal: [0, 0],
  velocity: 0,
  distance: 0,
  down: false,
  first: true,
  shiftKey: false
}

function handlers(set, props = {}, args) {
  // Common handlers
  const handleUp = (event, shiftKey) => {
    set(state => {
      const newProps = { ...state, down: false, first: false }
      const temp = props.onAction && props.onAction(newProps)
      if (props.onUp) props.onUp(newProps)
      return {
        ...newProps,
        event,
        shiftKey,
        lastLocal: state.local,
        temp: temp || newProps.temp
      }
    })
  }
  const handleDown = event => {
    const { target, pageX, pageY, shiftKey } = event.touches
      ? event.touches[0]
      : event
    set(state => {
      const lastLocal = state.lastLocal || initialState.lastLocal
      const newProps = {
        ...initialState,
        event,
        target,
        args,
        lastLocal,
        shiftKey,
        local: lastLocal,
        xy: [pageX, pageY],
        initial: [pageX, pageY],
        previous: [pageX, pageY],
        down: true,
        time: Date.now(),
        cancel: () => {
          stop()
          requestAnimationFrame(() => handleUp(event))
        }
      }
      const temp = props.onAction && props.onAction(newProps)
      if (props.onDown) props.onDown(newProps)
      return { ...newProps, temp }
    })
  }
  const handleMove = event => {
    const { pageX, pageY, shiftKey } = event.touches ? event.touches[0] : event
    set(state => {
      const time = Date.now()
      const x_dist = pageX - state.xy[0]
      const y_dist = pageY - state.xy[1]
      const delta_x = pageX - state.initial[0]
      const delta_y = pageY - state.initial[1]
      const distance = Math.sqrt(delta_x * delta_x + delta_y * delta_y)
      const len = Math.sqrt(x_dist * x_dist + y_dist * y_dist)
      const scalar = 1 / (len || 1)
      const newProps = {
        ...state,
        event,
        time,
        shiftKey,
        xy: [pageX, pageY],
        delta: [delta_x, delta_y],
        local: [
          state.lastLocal[0] + pageX - state.initial[0],
          state.lastLocal[1] + pageY - state.initial[1]
        ],
        velocity: len / (time - state.time),
        distance: distance,
        direction: [x_dist * scalar, y_dist * scalar],
        previous: state.xy,
        first: false
      }
      const temp = props.onAction && props.onAction(newProps)
      return { ...newProps, temp: temp || newProps.temp }
    })
  }

  const onDown = e => {
    if (props.mouse) {
      props.window.addEventListener(mouseMove, handleMove, props.passive)
      props.window.addEventListener(mouseUp, onUp, props.passive)
    }
    if (props.touch) {
      props.window.addEventListener(touchMove, handleMove, props.passive)
      props.window.addEventListener(touchEnd, onUp, props.passive)
    }

    handleDown(e)
  }

  const stop = () => {
    if (props.mouse) {
      props.window.removeEventListener(mouseMove, handleMove, props.passive)
      props.window.removeEventListener(mouseUp, onUp, props.passive)
    }
    if (props.touch) {
      props.window.removeEventListener(touchMove, handleMove, props.passive)
      props.window.removeEventListener(touchEnd, onUp, props.passive)
    }
  }

  const onUp = e => {
    const { shiftKey } = e

    stop()

    handleUp(e, shiftKey)
  }

  const output = {}
  const capture = props.passive.capture ? 'Capture' : ''

  if (props.mouse) {
    output[`onMouseDown${capture}`] = onDown
  }

  if (props.touch) {
    output[`onTouchStart${capture}`] = onDown
  }

  return output
}

class Gesture extends React.Component {
  static defaultProps = {
    window,
    touch: true,
    mouse: true,
    passive: { passive: false },
    onAction: undefined,
    onDown: undefined,
    onUp: undefined
  }
  constructor(props) {
    super(props)
    this.state = initialState
    let set = this.setState.bind(this)
    if (props.onAction) {
      this._state = initialState
      set = cb => (this._state = cb(this._state))
    }
    this.handlers = handlers(set, props)
  }

  render() {
    return this.props.children(this.handlers)
  }
}

export default Gesture
