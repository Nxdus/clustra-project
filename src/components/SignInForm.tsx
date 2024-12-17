import React from 'react'
import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { signIn } from 'next-auth/react'
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// สร้าง Zod schema สำหรับฟอร์ม
const signInSchema = z.object({
  email: z.string()
    .nonempty({ message: "Email is required" })
    .email({ message: "Invalid email format" }),
  password: z.string()
    .nonempty({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
});

// กำหนดชนิดของข้อมูลที่ผ่านการ validate แล้ว
type SignInFormValues = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors }
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema)
  });

  const onSubmit = async (data: SignInFormValues) => {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      callbackUrl: process.env.NEXTAUTH_URL,
      redirect: true
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-lg border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <h2 className="text-xl font-bold text-center text-blue-600 dark:text-blue-400">Sign In</h2>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <Input
          type="email"
          id="email"
          placeholder="Enter your email"
          // ใช้ register เพื่อผูก input เข้ากับ React Hook Form
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <Input
          type="password"
          id="password"
          placeholder="Enter your password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-all"
      >
        Sign In
      </button>
    </motion.form>
  )
}

export default SignInForm