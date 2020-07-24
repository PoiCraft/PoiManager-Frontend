export interface Response<T> {
  code: '200' | '401' | '404'
  type: 'prop_all' | 'prop_save' | 'log_all' | 'config_all' | string
  msg: string, 
  content: T
}
