import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      <MaxWidthWrapper className="mb-12 mt-20 sm:mt-40 flex flex-col items-center justify-center text-center ">
        <div className="mx-auto mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50">
          <p className="text-sm font-semibold text-gray-700">Invent is now live!</p>
        </div>
        <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
          Manage <span className="text-blue-600">inventory, stock</span>, and suppliers
          effortlessly.
        </h1>
        <p className="mt-5 max-w-prose text-zinc-700 sm:text-lg">
          Invent helps you track inventory, monitor stock levels, and streamline supplier operations
          in real-time. Start managing your business efficiently today.
        </p>

        <Link
          className={buttonVariants({
            size: 'lg',
            className: 'mt-5',
          })}
          href="/dashboard"
        >
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </MaxWidthWrapper>

      <div className="relative isolate overflow-hidden">
        {/* Background Gradient Shape 1 */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl sm:-top-80 pointer-events-none"
        >
          <div
            style={{
              clipPath:
                'polygon(74% 44%, 100% 62%, 98% 27%, 86% 0%, 81% 2%, 72% 33%, 60% 62%, 52% 68%, 48% 58%, 45% 34%, 28% 77%, 0% 65%, 18% 100%, 28% 77%, 76% 98%, 74% 44%)',
            }}
            className="relative left-[calc(50%-18rem)] aspect-[1155/678] w-[50rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-40 sm:w-[80rem]"
          />
        </div>

        {/* Background Gradient Shape 2 */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-20 -z-20 transform-gpu blur-3xl sm:-top-60 pointer-events-none"
        >
          <div
            style={{
              clipPath:
                'polygon(64% 34%, 100% 60%, 97% 20%, 85% 0%, 80% 5%, 68% 30%, 55% 60%, 48% 66%, 42% 55%, 38% 30%, 20% 75%, 0% 60%, 15% 100%, 24% 75%, 66% 96%, 64% 34%)',
            }}
            className="relative left-[calc(50%-25rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[45deg] bg-gradient-to-tr from-blue-300 via-purple-200 to-pink-200 opacity-30 sm:w-[72rem]"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto mb-32 mt-32 max-w-5xl sm:mt-56">
        <div className="mb-12 px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="mt-2 font-bold text-4xl text-gray-900 sm:text-5xl">
              Start Managing Inventory in Minutes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Inventory tracking has never been easier than with Invent.
            </p>
          </div>
        </div>

        {/* Steps */}
        <ol className="my-8 space-y-4 md:flex md:space-x-12 md:space-y-0">
          {/* Step 1 */}
          <li className="md:flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-small font-medium text-blue-600">Step 1</span>
              <span className="text-xl font-semibold">Create Your Account</span>
              <span className="mt-2 text-zinc-700">Sign up and get started in seconds.</span>
            </div>
          </li>

          {/* Step 2 */}
          <li className="md:flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-small font-medium text-blue-600">Step 2</span>
              <span className="text-xl font-semibold">Add Your Inventory</span>
              <span className="mt-2 text-zinc-700">
                Input products, categories, and stock levels with ease.
              </span>
            </div>
          </li>

          {/* Step 3 */}
          <li className="md:flex-1">
            <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-small font-medium text-blue-600">Step 3</span>
              <span className="text-xl font-semibold">Track and Optimize</span>
              <span className="mt-2 text-zinc-700">
                Monitor stock changes, set alerts, and streamline operations.
              </span>
            </div>
          </li>
        </ol>
      </div>
    </>
  );
}
