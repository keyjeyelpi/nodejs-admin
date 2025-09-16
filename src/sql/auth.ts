export const REGISTER = `
    CALL InsertUserWithRole(
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    );

`

export const LOGIN = `
    SELECT * 
    FROM v_user_with_roles
    WHERE (username = ? OR email = ?)
       AND AES_DECRYPT(password, ?) = ?;
`