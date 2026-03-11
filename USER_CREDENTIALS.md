# User Credentials Reference

**⚠️ DO NOT COMMIT THIS FILE TO GIT ⚠️**

This file contains the bcrypt password hashes needed for MongoDB user setup.

## Password Hashes

When adding users to MongoDB Atlas, use these hashes:

**Stewart:**
```json
{
  "username": "stewart",
  "name": "Stewart",
  "passwordHash": "$2a$10$5a99giexs4OobpRjjztQGuEAAcXeXc511rEnXb2X8G9zWf94mqNaq"
}
```
Login: `stewart` / `***REMOVED***`

**Sue:**
```json
{
  "username": "sue",
  "name": "Sue",
  "passwordHash": "$2a$10$CRJDtPFBNfERDvUcOMJNPe/voK/hq31CFSprKoM11JjBUn8BshmQG"
}
```
Login: `sue` / `***REMOVED***`

## MongoDB Credentials

- Username: `hairdiary`
- Password: `lMWNEPDnr2geTRIS`
- Connection: See `.env.local`

---

**Keep this file local only.** Delete before committing to git, or add to .gitignore.
