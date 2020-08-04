import * as React from 'react'
import { XTerm } from 'xterm-for-react'
import { FitAddon } from 'xterm-addon-fit'
import { ITerminalOptions, ITheme } from 'xterm'
import axios from 'axios'

import { createStyles, makeStyles, Theme } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'

import { Response, WebSocketResponse } from '../../API/response'
import { Log } from '../../API/log'

declare global {
  interface Window {
    websocketConn: WebSocket | null
  }
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    terminal: {
      width: '100%',
      padding: 12,
      backgroundColor: '#2b2b2b',
      marginBottom: theme.spacing(2),
      borderRadius: 4,
    },
    commandInput: {
      display: 'flex',
      justifyContent: 'center',
    },
    commandTextField: {
      width: '85vw',
    },
    sendButton: {
      margin: 8,
    },
  })
)

const red = '\x1B[1;3;31m'
const end = '\x1B[0m'

const termOptions = {
  fontSize: 16,
  fontFamily:
    'Menlo For Powerline,Consolas,Liberation Mono,Menlo,Courier,monospace',
  theme: {
    foreground: '#d2d2d2',
    background: '#2b2b2b',
    cursor: '#adadad',
    black: '#000000',
    red: '#d81e00',
    green: '#5ea702',
    yellow: '#cfae00',
    blue: '#427ab3',
    magenta: '#89658e',
    cyan: '#00a7aa',
    white: '#dbded8',
    brightBlack: '#686a66',
    brightRed: '#f54235',
    brightGreen: '#99e343',
    brightYellow: '#fdeb61',
    brightBlue: '#84b0d8',
    brightMagenta: '#bc94b7',
    brightCyan: '#37e6e8',
    brightWhite: '#f1f1f0',
  } as ITheme,
} as ITerminalOptions

const Console: React.FC = () => {
  const fitAddon = new FitAddon()
  const classes = useStyles()
  const termRef = React.useRef<XTerm>(null)
  const [token, setToken] = React.useState('')
  const [tokenDialogOpen, setTokenDialogOpen] = React.useState(false)
  const [tokenInputValue, setTokenInputValue] = React.useState('')
  const [connOpen, setConnOpen] = React.useState(false)
  const [commandInputValue, setCommandInputValue] = React.useState('')

  const getManagerLog = (token: string) => {
    return new Promise(resolve => {
      axios
        .get<Response<Log[]>>(`/api/log/all?token=${token}`)
        .then(res => {
          res.data.content.forEach(value =>
            termRef.current?.terminal.writeln(
              `${red}${value.type}: ${end}${value.log}`
            )
          )
          resolve()
        })
        .catch(err => {
          termRef.current?.terminal.writeln('Connection failed')
          if (err.response.status === 401) {
            termRef.current?.terminal.writeln(err.response.data.msg)
            termRef.current?.terminal.writeln('Please enter token.')
            setTokenDialogOpen(true)
          } else {
            termRef.current?.terminal.writeln('Connection lost.')
            termRef.current?.terminal.writeln(
              'Unknown error:' + err.response.data.msg + err.response.status
            )
            termRef.current?.terminal.writeln('Please contact the developer.')
          }
        })
    })
  }

  const webSocketOnMessage = (data: any) => {
    const res: WebSocketResponse = JSON.parse(data.data)
    switch (res.type) {
      case 'auth':
        if (res.msg === 'OK') {
          termRef.current?.terminal.writeln('Connection succeeded.')
        } else {
          termRef.current?.terminal.writeln(res.msg)
          termRef.current?.terminal.writeln('Please enter token.')
          setTokenDialogOpen(true)
        }
        break
      default:
        termRef.current?.terminal.writeln(`${red}${res.type}: ${end}${res.msg}`)
    }
  }

  const connect = React.useCallback((token: string) => {
    termRef.current?.terminal.clear()
    termRef.current?.terminal.writeln('Connecting to PoiManager...')
    getManagerLog(token).then(() => {
      window.websocketConn = new WebSocket(
        `ws://${window.location.host}/api/ws/cmd`
      )
      setConnOpen(true)
      window.websocketConn.onclose = () => {
        setConnOpen(false)
        termRef.current?.terminal.writeln('Connection lost.')
      }
      window.websocketConn.onmessage = webSocketOnMessage
      window.websocketConn.onopen = () => {
        window.websocketConn?.send(JSON.stringify({ token }))
      }
    })
  }, [])

  const sendCommand = () => {
    window.websocketConn?.send(
      JSON.stringify({ token, cmd: commandInputValue })
    )
    setCommandInputValue('')
  }

  React.useEffect(() => {
    fitAddon.fit()
  }, [fitAddon])

  React.useEffect(() => {
    connect(token)
  }, [connect, token])

  return (
    <React.Fragment>
      <div>
        <XTerm
          ref={termRef}
          className={classes.terminal}
          addons={[fitAddon]}
          options={termOptions}
        />
        <div className={classes.commandInput}>
          <TextField
            label='在此输入指令'
            variant='outlined'
            className={classes.commandTextField}
            value={commandInputValue}
            onChange={e => setCommandInputValue(e.target.value)}
          />
          <Button
            variant='contained'
            color='primary'
            className={classes.sendButton}
            onClick={sendCommand}>
            执行
          </Button>

          {connOpen ? (
            <Button
              variant='contained'
              color='primary'
              className={classes.sendButton}
              onClick={() => {
                window.websocketConn?.close()
                setConnOpen(false)
              }}>
              中断
            </Button>
          ) : (
            <Button
              variant='contained'
              color='primary'
              className={classes.sendButton}
              onClick={() => {
                connect(token)
              }}>
              连接
            </Button>
          )}
        </div>
      </div>
      <Dialog open={tokenDialogOpen} aria-labelledby='form-dialog-title'>
        <DialogTitle id='form-dialog-title'>请输入 Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请您输入 Token ，在程序启动时能找到{' '}
            <code> >Manager Token: xxxxxx</code>的字样，您输入
            <code>Manager Token: </code>后的文本即可
          </DialogContentText>
          <TextField
            autoFocus
            margin='dense'
            id='token'
            label='Token'
            type='text'
            onChange={e => setTokenInputValue(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTokenDialogOpen(false)
            }}
            color='primary'>
            取消
          </Button>
          <Button
            onClick={() => {
              setToken(tokenInputValue)
              setTokenDialogOpen(false)
            }}
            color='primary'>
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

export default Console
