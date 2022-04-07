import React from 'react';

import {Button} from '@/components/buttons/Button';
import {GitHub} from '@/components/icons/GitHub';
import {Google} from '@/components/icons/Google';
import {Rss} from '@/components/icons/Rss';
import {Checkbox} from '@/components/inputs/Checkbox';
import {Input} from '@/components/inputs/Input';
import {PrimaryLink} from '@/components/links/PrimaryLink';

const Login = () => {
  return (
    <div className="flex min-h-full">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Rss className="h-12 w-auto text-red-300" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>

          <div className="mt-8">
            <div>
              <div>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div>
                    <Button variant="light" isFullWidth>
                      <span className="sr-only">Sign in with Google</span>
                      <Google className="h-5 w-5" />
                    </Button>
                  </div>

                  <div>
                    <Button variant="light" isFullWidth>
                      <span className="sr-only">Sign in with GitHub</span>
                      <GitHub className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="relative mt-6">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <form action="#" method="POST" className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox id="remember-me" name="remember-me" />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <PrimaryLink href="#">Forgot your password?</PrimaryLink>
                  </div>
                </div>

                <div>
                  <Button type="submit" isFullWidth>
                    Sign in
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1542382257-80dedb725088?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2128&q=80"
          alt=""
        />
      </div>
    </div>
  );
};

export default Login;
