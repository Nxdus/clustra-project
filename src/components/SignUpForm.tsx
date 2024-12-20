import React, { useState } from 'react'
import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { signIn } from 'next-auth/react'
import axios from 'axios';

const SignUpForm = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await axios.post('/api/auth/signup', {
                email,
                password
            });

            if (response.status === 200) {
                console.log('User registered successfully')
                const body = response.data
                const user = body.user
                const { email, password } = user

                signIn('credentials', {
                    email: email,
                    password: password,
                    callbackUrl: process.env.NEXTAUTH_URL,
                    redirect: true
                })
            } else {
                console.error('Registration failed');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(error.response?.data.message || 'An error occurred');
            } else {
                console.error('An unexpected error occurred');
            }
        }
    }

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white dark:bg-slate-800 border p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
        >
            <h2 className="text-xl font-bold text-center text-blue-600 dark:text-blue-400">Sign Up</h2>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <Input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-all"
            >
                Sign Up
            </button>
        </motion.form>
    )
}

export default SignUpForm