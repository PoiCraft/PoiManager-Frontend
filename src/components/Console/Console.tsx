import * as React from 'react'
import { XTerm } from 'xterm-for-react'
import { createStyles, makeStyles, Theme } from '@material-ui/core'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

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
    commandTextField:{
      width: '85vw'
    },
    sendButton: {
      margin: 8,
    },
  })
)

const Console: React.FC = () => {
  const classes = useStyles()
  const termRef = React.useRef<XTerm>(null)

  return (
    <React.Fragment>
      <div>
        <XTerm ref={termRef} className={classes.terminal} />
        <div className={classes.commandInput}>
          <TextField label='在此输入指令' variant='outlined' className={classes.commandTextField
          } />
          <Button
            variant='contained'
            color='primary'
            className={classes.sendButton}>
            执行
          </Button>
        </div>
      </div>
    </React.Fragment>
  )
}

export default Console
