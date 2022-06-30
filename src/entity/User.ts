import moment from 'moment'
import { RowDataPacket, FieldPacket, OkPacket } from 'mysql2'
import jwt from 'jsonwebtoken'
import getDatabase from '../database'

export default class User {
    id: number
    google_id?: string
    google_access_token?: string
    google_refresh_token?: string
    google_expiry_date?: number

    async getJWT(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            jwt.sign({
                sub: this.id
            }, process.env.JWT_SECRET, {
                algorithm: 'HS512'
            }, (err, token) => {
                if (err)
                    return reject(err)

                resolve(token)
            })
        })
    }

    static async verifyJWT(token: string): Promise<User> {
        const decoded = await new Promise<jwt.JwtPayload>((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err)
                    return reject(err)

                if (typeof decoded === 'string')
                    return reject(decoded)

                resolve(decoded)
            })
        })

        const user = await User.getById(decoded.sub)

        return user
    }

    async create(): Promise<User> {
        const expiryDate = this.google_expiry_date ? moment.unix(this.google_expiry_date / 1000).format('YYYY-MM-DD HH:mm:ss') : null

        const [result, fields]: [OkPacket, FieldPacket[]] = await getDatabase().execute(`
        INSERT INTO users (
            google_id,
            google_access_token,
            google_refresh_token,
            google_expiry_date
        ) VALUES (
            ?,
            ?,
            ?,
            ?
        ) ON DUPLICATE KEY UPDATE
            google_access_token = ?,
            google_expiry_date = ?;
        `, [
            this.google_id || null,
            this.google_access_token || null,
            this.google_refresh_token || null,
            expiryDate,
            this.google_access_token || null,
            expiryDate
        ])

        this.id = result.insertId

        return this
    }

    static async getById(id: string): Promise<User> {
        const [rows, fields]: [RowDataPacket[], FieldPacket[]] = (
            await getDatabase().query(`
                SELECT * FROM users WHERE id=?;
            `, [
                id
            ])
        )

        if (rows.length === 0)
            return null

        const user = new User()
        user.id = rows[0].id
        user.google_id = rows[0].google_id
        user.google_access_token = rows[0].google_access_token
        user.google_refresh_token = rows[0].google_refresh_token
        user.google_expiry_date = rows[0].google_expiry_date
        return user
    }

    static async getByGoogleId(id: string): Promise<User> {
        const [rows, fields]: [RowDataPacket[], FieldPacket[]] = (
            await getDatabase().query(`
                SELECT * FROM users WHERE google_id=?;
            `, [
                id
            ])
        )

        if (rows.length === 0)
            return null

        const user = new User()
        user.id = rows[0].id
        user.google_id = rows[0].google_id
        user.google_access_token = rows[0].google_access_token
        user.google_refresh_token = rows[0].google_refresh_token
        user.google_expiry_date = rows[0].google_expiry_date
        return user
    }

    static async createTable(): Promise<void> {
        await getDatabase().execute(`
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT,
                \`google_id\` varchar(64) DEFAULT NULL,
                \`google_access_token\` varchar(255) DEFAULT NULL,
                \`google_refresh_token\` varchar(255) DEFAULT NULL,
                \`google_expiry_date\` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`GOOGLE_ID\` (\`google_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `)
    }
}
