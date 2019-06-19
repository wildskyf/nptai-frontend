import React, { Component } from 'react'
import axios from 'axios'
import socketIOClient from 'socket.io-client'

class App extends Component {
  constructor () {
    super()
    // TODO: single topic for now
    this.state = {
      currentTopic: 'tech',
      topics: [],
      friends: [],
      me: { key: '' },
      messages: {},
      hubInput: 'http://localhost:3003',
      hub: 'http://localhost:3003',
      apiInput: 'http://localhost:10000',
      api: 'http://localhost:10000'
    }

    this.messageEndRef = React.createRef()
  }

  componentDidMount () {
    this.load()
  }

  onKeyPress (e) {
    if (e.key === 'Enter') {
      this.submit(e.target.value)

      e.target.value = ''
    }
  }

  scrollMessage () {
    this.messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  async submit (msg) {
    await axios.post(`${this.state.api}/topics/${this.state.currentTopic}`, { data: { id: Date.now(), message: msg } })
    this.scrollMessage()
  }

  async load () {
    let res

    res = await axios.get(`${this.state.api}/topics`)
    let topics = res.data.result

    res = await axios.get(`${this.state.api}/friends`)
    let friends = res.data.result

    res = await axios.get(`${this.state.api}/me`)
    let me = res.data.result
    this.connect()

    this.setState({ topics, friends, me })
  }

  async connect () {
    if (this.socket) this.socket.close()

    await axios.post(`${this.state.hub}/join`, { public_key: this.state.me.key })

    let socket = socketIOClient(this.state.hub)
    this.socket = socket
    this.socket.on('update', (msgs) => {
      console.log(msgs)

      let messages = {}
      for (let i = 0; i < msgs.length; i++) {
        let m = msgs[i]
        if (!messages[m.topic]) messages[m.topic] = []
        messages[m.topic].push(m)
      }

      this.setState({ messages })
      this.scrollMessage()
    })
  }

  changeTopic (topic) {
    return () => {
      this.setState({ currentTopic: topic })
    }
  }

  handleHubChange (e) {
    this.setState({ hubInput: e.target.value })
  }

  handleHubKeyPress (e) {
    if (e.key === 'Enter') {
      this.setState({ hub: this.state.hubInput }, () => {
        this.connect()
      })

      e.target.value = ''
    }
  }

  handleAPIChange (e) {
    this.setState({ apiInput: e.target.value })
  }

  handleAPIInputKeyPress (e) {
    if (e.key === 'Enter') {
      this.setState({ api: this.state.apiInput }, () => {
        this.load()
        this.connect()
      })

      e.target.value = ''
    }
  }

  render () {
    return (
      <div className='w-screen h-screen app' >
        <div className='sidebar bg-gray-200' >
          <div className='flex flex-col justify-between h-full'>
            <div className='overflow-y-auto p-2'>
              <div className='mb-4'>
                <h2>P.me</h2>
                <input className='p-1 border border-gray-500 rounded font-mono text-xs w-full bg-gray-200' value={this.state.apiInput} onChange={this.handleAPIChange.bind(this)} onKeyPress={this.handleAPIInputKeyPress.bind(this)} />
              </div>
              <div className='mb-4'>
                <h2>Hub</h2>
                <input className='p-1 border border-gray-500 rounded font-mono text-xs w-full bg-gray-200' value={this.state.hubInput} onChange={this.handleHubChange.bind(this)} onKeyPress={this.handleHubKeyPress.bind(this)} />
              </div>
              <h2>Topics</h2>
              <ul>
                {this.state.topics.map(t => {
                  if (t === this.state.currentTopic) {
                    return <li onClick={this.changeTopic(t).bind(this)} key={t} className='rounded bg-gray-400 cursor-pointer'>#{t}</li>
                  } else {
                    return <li onClick={this.changeTopic(t).bind(this)} key={t} className='cursor-pointer'>#{t}</li>
                  }
                })}
              </ul>
              <div className='mt-4'>
                <h2>Friends</h2>
                <ul>
                  {this.state.friends.map(f => <li key={f.id}>{f.name}</li>)}
                </ul>
                <span className='text-gray-700 underline cursor-pointer'>add new friend</span>
              </div>
            </div>
            <div className='bg-gray-100 h-20 flex flex-col justify-around px-2'>
              <h2>@username</h2>
              <input className='bg-gray-400 border border-gray-500 w-full' value={this.state.me.key} readOnly />
            </div>
          </div>

        </div>
        <div className='message bg-red overflow-y-auto px-2' >
          <ul className='min-h-full flex flex-col justify-end'>
            {this.state.messages[this.state.currentTopic] ? this.state.messages[this.state.currentTopic].map(m => <li key={m.id}><span className='font-bold'>{m.author ? m.author.substring(0, 8) : ''}...</span>: {m.message}</li>) : ''}
          </ul>
          <div id='end' ref={this.messageEndRef} />
        </div>
        <div className='prompt bg-blue'>
          <input onKeyPress={this.onKeyPress.bind(this)} type='text' placeholder='say something...' className='border border-grey-100 w-full h-full p-2 rounded' />
        </div>
      </div>
    )
  }
}

export default App
