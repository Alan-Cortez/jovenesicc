import {createClient} from '@libsql/client';
const client = createClient({
  url:'libsql://jct-valcordigitalsolutions.aws-us-west-2.turso.io',
  authToken:'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkxODg4NDYsImlkIjoiMDFhMDkzYTUtZTkwMS03ZDJhLTkyYzYtZGI0YjQ3NDM4Y2FmIiwia2lkIjoiVkFDWjFOMjhQUVZ4MVNQb21aanB1YUt1Wm9kcG9JYndNY21NbGVJTnQtOCIsInJpZCI6ImYwZmI2OWMzLWEwNDMtNDI1Yy04YmYzLTJkNGI3YjAyZmI5MCJ9.ep91xqJH1S9lMvdzrAxAAVYUjFDGeiz3F1cNl_xrvvIceXUfmCm4bPaiGWo2y3jh5fMUDk18Fy7Lp7yJMzs3Aw'
});
client.execute('ALTER TABLE group_guests ADD COLUMN invited_by INTEGER REFERENCES users(id)').then(() => console.log('Column added')).catch(e => console.error(e));
