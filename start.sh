#!/bin/sh

# รอให้ database พร้อมใช้งาน
./wait-for-it.sh db:5432 -- npx prisma migrate deploy

# หลังจาก migrate เสร็จแล้วค่อยเริ่ม app
npm run start