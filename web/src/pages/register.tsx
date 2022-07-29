import {yupResolver} from '@hookform/resolvers/yup';
import {pipe} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as yup from 'yup';

import {Route} from '@/lib/routes';
import {useRouteOfType} from '@/lib/routing';

import {Button} from '@/components/buttons/Button';
import {GitHub} from '@/components/icons/GitHub';
import {Google} from '@/components/icons/Google';
import {PasswordField} from '@/components/inputs/PasswordField';
import {TextField} from '@/components/inputs/TextField';
import {Layout} from '@/components/layout/Layout';
import {PrimaryLink} from '@/components/links/PrimaryLink';
import {Logo} from '@/components/Logo';
import {useToast} from '@/components/Toast';

import {authenticate, register, useSession} from '@/models/user';

import {NextPageWithLayout} from './_app';

type Inputs = {
  name: string;
  email: string;
  password: string;
  passwordCheck: string;
};

const Inputs = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(3).max(50).required(),
  passwordCheck: yup
    .string()
    .required()
    .oneOf([yup.ref('password')], 'Passwords should match'),
});

const ToastConf = {variant: 'danger', position: 'bottom-left'} as const;

const Register: NextPageWithLayout = () => {
  const route = useRouteOfType('Register');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const {
    register: registerField,
    handleSubmit,
    formState: {errors},
  } = useForm<Inputs>({
    resolver: yupResolver(Inputs),
    defaultValues: {email: O.toUndefined(route)?.email},
  });

  const {login} = useSession();

  const onSubmit: SubmitHandler<Inputs> = ({name, email, password}) => {
    setLoading(true);

    pipe(
      register({name, email, password}),
      TE.chain(() => authenticate({email, password})),
      TE.match(
        () => {
          toast.show('Something went wrong.', ToastConf);

          setLoading(false);
        },
        ({data: user}) => {
          login(user);
        },
      ),
    )();
  };

  return (
    <div className="flex min-h-full">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Logo />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-700">
              Create an account
            </h2>
          </div>

          <div className="mt-8">
            <div>
              <div>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div>
                    <Button variant="light" isFullWidth disabled>
                      <span className="sr-only">Register in with Google</span>
                      <Google className="h-5 w-5" />
                    </Button>
                  </div>

                  <div>
                    <Button variant="light" isFullWidth disabled>
                      <span className="sr-only">Register in with GitHub</span>
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
                <TextField
                  label="Name"
                  input={{
                    id: 'name',
                    type: 'name',
                    placeholder: 'John Doe',
                    autoComplete: 'new-name',
                    variant: errors.name ? 'error' : 'default',
                    autoFocus: true,
                    ...registerField('name', {required: true}),
                  }}
                  message={errors.name?.message}
                />

                <TextField
                  label="Email"
                  input={{
                    id: 'email',
                    type: 'email',
                    placeholder: 'doe.john@ymail.com',
                    autoComplete: 'new-email',
                    variant: errors.email ? 'error' : 'default',
                    ...registerField('email', {required: true}),
                  }}
                  message={errors.email?.message}
                />

                <PasswordField
                  label="Password"
                  input={{
                    id: 'password',
                    placeholder: '****************',
                    autoComplete: 'new-password',
                    variant: errors.password ? 'error' : 'default',
                    ...registerField('password', {required: true}),
                  }}
                  message={errors.password?.message}
                />

                <PasswordField
                  label="Cofirm password"
                  input={{
                    id: 'passwordCheck',
                    placeholder: '****************',
                    autoComplete: 'new-passwordCheck',
                    variant: errors.passwordCheck ? 'error' : 'default',
                    ...registerField('passwordCheck', {required: true}),
                  }}
                  message={errors.passwordCheck?.message}
                />

                <Button
                  type="submit"
                  isFullWidth
                  isLoading={loading}
                  disabled={loading}
                  className="py-2 text-base"
                >
                  Register
                </Button>

                <div className="text-center">
                  <span className="text-md text-gray-500">
                    Already have an account?
                  </span>{' '}
                  <PrimaryLink href={Route.login()} className="text-md">
                    Login
                  </PrimaryLink>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/connected.jpg"
          alt=""
        />
      </div>
    </div>
  );
};

Register.getLayout = (page) => (
  <Layout variant="clean" seo={{templateTitle: 'Register'}}>
    {page}
  </Layout>
);

export default Register;
