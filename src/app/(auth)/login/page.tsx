"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-12 w-12 text-primary" />
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SUPER PLACE
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">로그인</h1>
          <p className="text-gray-600">역할을 선택하여 로그인하세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 학생 로그인 */}
          <Link href="/login/student" className="group">
            <Card className="border-2 border-green-100 hover:border-green-300 hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <CardHeader className="bg-gradient-to-br from-green-50 to-blue-50 pb-12">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">학생 로그인</CardTitle>
                <CardDescription className="text-center text-base">
                  학습을 시작하고 AI 도우미와 함께 공부하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    학습 자료 열람
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    과제 제출 및 확인
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    AI 학습 도우미
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    내 성적 확인
                  </li>
                </ul>
                <div className="flex items-center justify-center gap-2 text-green-600 font-semibold group-hover:gap-4 transition-all">
                  학생으로 로그인
                  <ArrowRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 학원장/선생님 로그인 */}
          <Link href="/login/director" className="group">
            <Card className="border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 cursor-pointer h-full">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-indigo-50 pb-12">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="h-12 w-12 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">학원장 / 선생님</CardTitle>
                <CardDescription className="text-center text-base">
                  학원을 관리하고 학생들의 학습을 지도하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-8">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    학생 및 선생님 관리
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    학습 자료 등록
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    과제 및 성적 관리
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    학원 통계 확인
                  </li>
                </ul>
                <div className="flex items-center justify-center gap-2 text-purple-600 font-semibold group-hover:gap-4 transition-all">
                  관리자로 로그인
                  <ArrowRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center mt-8">
          <span className="text-gray-600">아직 계정이 없으신가요? </span>
          <Link href="/register" className="text-primary hover:underline font-medium">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
