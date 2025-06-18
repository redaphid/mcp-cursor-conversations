import { homedir } from 'os'

export const getDbPath = () => {
  if (process.platform === 'darwin') return `${homedir()}/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
  return `${homedir()}/Cursor/User/globalStorage/state.vscdb`
}