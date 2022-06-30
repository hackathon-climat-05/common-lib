import mysql, { Connection } from 'mysql2/promise'
import User from './entity/User'

let connection: Connection = null

export const initialize = async () => {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  })

 await Promise.all([
    User.createTable()
 ])
}

export default () => connection
