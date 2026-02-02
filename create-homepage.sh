#!/bin/bash

# page.tsx에서 NextAuth 관련 부분 제거
sed -i '/import { useSession, signOut } from "next-auth\/react"/d' src/app/page.tsx
sed -i 's/const { data: session, status } = useSession();/\/\/ const { data: session, status } = useSession(); \/\/ Static Export/g' src/app/page.tsx
sed -i 's/onClick={() => signOut({ callbackUrl/onClick={() => console.log("로그아웃 - Static Export에서는 작동하지 않음") \/\/ signOut({ callbackUrl/g' src/app/page.tsx
sed -i 's/{session/\/\/{session/g' src/app/page.tsx
sed -i 's/status === "loading"/false \/\/ status === "loading"/g' src/app/page.tsx
sed -i 's/status === "authenticated"/false \/\/ status === "authenticated"/g' src/app/page.tsx

echo "NextAuth 제거 완료"
