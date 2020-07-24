import * as React from 'react'
import { XTerm } from 'xterm-for-react'
import axios from 'axios'

import { createStyles, makeStyles, Theme } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContentText from '@material-ui/core/DialogContentText'

import { Response } from '../../API/response'
import { Log } from '../../API/log'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    terminal: {
      width: '100%',
      paddingBottom: theme.spacing(2),
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

const Console: React.FC = () => {
  const classes = useStyles()
  const termRef = React.useRef<XTerm>(null)
  const [token, setToken] = React.useState('')
  const [tokenDialogOpen, setTokenDialogOpen] = React.useState(false)
  const [tokenInputValue,setTokenInputValue] = React.useState('')

  const getManagerLog = (token: string) => {
    axios
      .get<Response<Log[]>>(`/api/log/all?token=${token}`)
      .then(res => {
        res.data.content.forEach(value=>termRef.current?.terminal.writeln(`${value.type}:${value.log}`))
      })
      .catch(err => {
        if (err.response.status === 401) {
          termRef.current?.terminal.writeln(err.response.data.msg)
          setTokenDialogOpen(true)
        }
      })
  }

  React.useEffect(() => {
    termRef.current?.terminal.writeln('Connecting to PoiManager...')
    getManagerLog(token)
  }, [token])

  return (
    <React.Fragment>
      <div>
        <XTerm ref={termRef} className={classes.terminal} />
        <div className={classes.commandInput}>
          <TextField
            label='在此输入指令'
            variant='outlined'
            className={classes.commandTextField}
          />
          <Button
            variant='contained'
            color='primary'
            className={classes.sendButton}>
            执行
          </Button>
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
            onChange={e=>setTokenInputValue(e.target.value)}
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
