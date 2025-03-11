import React, { Component } from 'react'

export class ErrorBoundry extends Component {
  // constructor(props: {}) {
  //   super(props)

  //   this.state = {
  //     hasError: false
  //   }
  // }

  // static getDerivedStateFromError(error: {}) {
  //   return { hasError: true }
  // }

  // state = { hasError: false }

  render() {
    return (
      <div>ErrorBoundry</div>
    )
  }
}

export default ErrorBoundry