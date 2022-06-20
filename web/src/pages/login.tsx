import {EyeIcon, EyeOffIcon} from '@heroicons/react/solid';
import {yupResolver} from '@hookform/resolvers/yup';
import * as E from 'fp-ts/Either';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import {useAtom} from 'jotai';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {Route} from '@/lib/routes';

import {Button} from '@/components/buttons/Button';
import {GitHub} from '@/components/icons/GitHub';
import {Google} from '@/components/icons/Google';
import {Rss} from '@/components/icons/Rss';
import {Field} from '@/components/inputs/Field';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';

import {authenticate, SessionAtom} from '@/models/user';

type Inputs = {
  email: string;
  password: string;
  passwordCheck: string;
};

const Inputs = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(3).max(50).required(),
});

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPass] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<Inputs>({resolver: yupResolver(Inputs)});

  const [_session, setSession] = useAtom(SessionAtom);

  const onSubmit: SubmitHandler<Inputs> = async ({email, password}) => {
    setLoading(true);

    pipe(
      await authenticate({email, password})(),
      E.match(
        (error) => {
          // TODO: show a toast or inline error
          // eslint-disable-next-line no-console
          console.log('Failed to login', error);
        },
        (user) => {
          setSession(O.some(user));
        },
      ),
    );

    setLoading(false);
  };

  return (
    <Layout variant="clean">
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
                      <Button variant="light" isFullWidth disabled>
                        <span className="sr-only">Sign in with Google</span>
                        <Google className="h-5 w-5" />
                      </Button>
                    </div>

                    <div>
                      <Button variant="light" isFullWidth disabled>
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
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <Field
                    label="Email"
                    input={{
                      id: 'email',
                      type: 'email',
                      autoComplete: 'email',
                      variant: errors.email ? 'error' : 'default',
                      ...register('email', {required: true}),
                    }}
                    message={errors.email?.message}
                  />

                  <Field
                    label="Password"
                    input={{
                      id: 'password',
                      type: showPassword ? 'text' : 'password',
                      autoComplete: 'password',
                      variant: errors.password ? 'error' : 'default',
                      ...register('password', {required: true}),
                    }}
                    message={errors.password?.message}
                    icon={{
                      After: showPassword ? EyeIcon : EyeOffIcon,
                      onClick: showPassword
                        ? () => setShowPass(false)
                        : () => setShowPass(true),
                    }}
                  />

                  <div className="flex items-center justify-end">
                    <PrimaryLink
                      className="text-md"
                      href={Route.resetPasswordRequest}
                    >
                      Forgot your password?
                    </PrimaryLink>
                  </div>

                  <Button
                    type="submit"
                    isFullWidth
                    isLoading={loading}
                    disabled={loading}
                  >
                    Sign in
                  </Button>

                  <div className="text-center">
                    <span className="text-md text-gray-500">
                      Not registered yet?
                    </span>{' '}
                    <PrimaryLink href={Route.register()} className="text-md">
                      Create an account
                    </PrimaryLink>
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
    </Layout>
  );
};

export default Login;
