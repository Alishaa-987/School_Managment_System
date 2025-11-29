import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-lamaSkyLight/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-lamaSky to-lamaPurple rounded-xl flex items-center justify-center shadow-lg">
                  <Image
                    src="/logo.png"
                    alt="SchoolHub Logo"
                    width={28}
                    height={28}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-lamaSky to-lamaPurple bg-clip-text text-transparent">SchoolHub</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-700 hover:text-lamaSky px-3 py-2 text-sm font-semibold transition-colors">Features</a>
                <a href="#benefits" className="text-gray-700 hover:text-lamaSky px-3 py-2 text-sm font-semibold transition-colors">Benefits</a>
                <a href="#pricing" className="text-gray-700 hover:text-lamaSky px-3 py-2 text-sm font-semibold transition-colors">Pricing</a>
                <a href="#contact" className="text-gray-700 hover:text-lamaSky px-3 py-2 text-sm font-semibold transition-colors">Contact</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="bg-gradient-to-r from-lamaSky to-lamaPurple text-white px-8 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-lamaSkyLight via-white to-lamaPurpleLight overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-lamaSky/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-lamaPurple/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lamaYellow/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Smart School
                <span className="block text-lamaSky">
                  Management System
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:mt-8 sm:text-xl leading-relaxed">
                Transform your school with our powerful, all-in-one platform designed for
                <span className="font-semibold text-lamaPurple"> modern education</span>.
                Streamline administration, enhance communication, and boost student success.
              </p>
              <div className="mt-10 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/admin" className="group w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-lamaSky to-lamaPurple hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg">
                    <span className="mr-2">🚀</span>
                    Start Free Trial
                  </Link>
                  {/* <button className="w-full flex items-center justify-center px-8 py-4 border-2 border-lamaSky text-lg font-bold rounded-2xl text-lamaSky bg-white hover:bg-lamaSky hover:text-white transition-all duration-300 shadow-md">
                    <span className="mr-2">▶️</span>
                    Watch Demo
                  </button> */}
                </div>
                <p className="mt-4 text-sm text-gray-500">✨ No credit card required • 14-day free trial • Cancel anytime</p>
              </div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <div className="relative">
                {/* Main dashboard mockup */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-gradient-to-r from-lamaSky to-lamaPurple px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">📊</span>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">SchoolHub Dashboard</h3>
                          <p className="text-white/80 text-sm">Real-time school management</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-lamaSky">1,247</p>
                          </div>
                          <div className="w-12 h-12 bg-lamaSky/10 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👨‍🎓</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                            <p className="text-3xl font-bold text-lamaPurple">89</p>
                          </div>
                          <div className="w-12 h-12 bg-lamaPurple/10 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">👨‍🏫</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">✅</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Attendance Updated</p>
                          <p className="text-sm text-gray-600">Grade 10A - 95% present today</p>
                        </div>
                        <span className="text-xs text-gray-500">2 min ago</span>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📝</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">New Assignment Posted</p>
                          <p className="text-sm text-gray-600">Mathematics - Algebra Quiz due Friday</p>
                        </div>
                        <span className="text-xs text-gray-500">15 min ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-lamaYellow rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-lamaSky rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
                  <span className="text-xl">🎓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-lamaSky/10 text-lamaSky font-semibold text-lg uppercase tracking-wide mb-4">
              ✨ Features
            </div>
            <h2 className="text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to
              <span className="block text-lamaSky">
                manage your school
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-xl text-gray-600 lg:mx-auto leading-relaxed">
              Comprehensive tools designed specifically for modern school administration and educational excellence
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "👨‍🎓",
                  title: "Student Management",
                  description: "Complete student profiles, enrollment tracking, and academic records management.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "👨‍🏫",
                  title: "Teacher Management",
                  description: "Manage teacher profiles, subjects, schedules, and performance tracking.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                },
                {
                  icon: "📊",
                  title: "Attendance Tracking",
                  description: "Real-time attendance monitoring with automated reports and notifications.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "📝",
                  title: " Exams & Results",
                  description: "Create, manage, and grade online examinations with detailed analytics.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                },
                {
                  icon: "📅",
                  title: "Timetable Scheduling",
                  description: "Automated timetable generation with conflict resolution and optimization.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "👨‍👩‍👧‍👦",
                  title: "Parent Portal",
                  description: "Secure portal for parents to monitor student progress and communicate with teachers.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                },
                {
                  icon: "📢",
                  title: "Events & Announcements",
                  description: " events and announcements to keep everyone informed.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 ${feature.bgColor} rounded-3xl shadow-lg ${feature.shadowColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mx-auto mb-6`}>
                    <span className="text-4xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-lamaSky transition-colors duration-300">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-lamaPurple/10 text-lamaPurple font-semibold text-xl uppercase tracking-wide mb-4">
              💎 Benefits
            </div>
            <h2 className="text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
              Why choose <span className="text-lamaPurple">SchoolHub?</span>
            </h2>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "⚡",
                  title: "Seamless Administration",
                  description: "Automate routine tasks and focus on what matters most - education.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "💬",
                  title: "Real-time Communication",
                  description: "Instant messaging, announcements, and notifications keep everyone connected.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                },
                {
                  icon: "🔒",
                  title: "Secure & Fast",
                  description: "Enterprise-grade security with lightning-fast performance.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "☁️",
                  title: "Cloud-based Access",
                  description: "Access your data anywhere, anytime, from any device.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                },
                {
                  icon: "📱",
                  title: "Easy Dashboards",
                  description: "Intuitive interfaces designed specifically for teachers and parents.",
                  bgColor: "bg-lamaSky",
                  shadowColor: "shadow-lamaSky/30"
                },
                {
                  icon: "🏫",
                  title: "Modern School Ready",
                  description: "Built for contemporary educational institutions and their unique needs.",
                  bgColor: "bg-lamaPurple",
                  shadowColor: "shadow-lamaPurple/30"
                }
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 group">
                  <div className={`flex-shrink-0 w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center shadow-md ${benefit.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{benefit.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-lamaSky transition-colors duration-300">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* System Preview Section */}
      <section className="py-20 bg-lamaPurpleLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Powerful yet simple to use
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Our intuitive dashboard provides everything you need at your fingertips.
                From student enrollment to grade management, SchoolHub makes school administration effortless.
              </p>
              <div className="mt-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-gray-900">Student Dashboard</h4>
                    <p className="text-sm text-gray-600 mt-1">View grades, attendance, and assignments</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-gray-900">Teacher Portal</h4>
                    <p className="text-sm text-gray-600 mt-1">Manage classes, grades, and communications</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-gray-900">Admin Control</h4>
                    <p className="text-sm text-gray-600 mt-1">Complete school management oversight</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-gray-900">Parent Access</h4>
                    <p className="text-sm text-gray-600 mt-1">Monitor student progress and activities</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-lamaSky px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Dashboard Preview</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Real-time attendance tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Automated grade calculations</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Instant notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Mobile-responsive design</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-lamaSkyLight/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-lamaYellow/20 text-lamaSky font-semibold text-md uppercase tracking-wide mb-4">
              💬 Testimonials
            </div>
            <h2 className="text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
              Trusted by
              <span className="block text-lamaSky">
                schools worldwide
              </span>
            </h2>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {[
                {
                  quote: "SchoolHub has transformed how we manage our school. The automation features save us hours every week.",
                  author: "Dr. Sarah Johnson",
                  role: "Principal",
                  school: "Lincoln High School"
                },
                {
                  quote: "The parent portal keeps our families engaged and informed. Communication has never been better.",
                  author: "Mr. Michael Chen",
                  role: "Teacher",
                  school: "Riverside Elementary"
                },
                {
                  quote: "As a parent, I love being able to track my child's progress in real-time. It's so convenient!",
                  author: "Mrs. Emily Rodriguez",
                  role: "Parent",
                  school: "Oakwood Academy"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-lamaSkyLight hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-lamaSky to-lamaPurple rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5">
                      <div className="text-lg font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-lamaSky font-medium">{testimonial.role} at {testimonial.school}</div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-6xl text-lamaSkyLight font-serif">&ldquo;</div>
                    <p className="text-gray-700 leading-relaxed pl-4 relative z-10 font-medium">{testimonial.quote}</p>
                    <div className="absolute -bottom-4 -right-2 text-6xl text-lamaSkyLight font-serif">&rdquo;</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-white to-lamaPurpleLight/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-lamaSky/10 text-lamaSky font-semibold text- uppercase tracking-wide mb-4">
              💰 Pricing
            </div>
            <h2 className="text-3xl leading-tight font-black tracking-tight text-gray-900 sm:text-4xl">
              Choose the right plan
              <span className="block text-lamaPurple">
                for your school
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-xl text-gray-600 lg:mx-auto leading-relaxed">
              Flexible pricing designed for schools of all sizes, with everything you need to succeed
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {[
                {
                  name: "Basic",
                  price: "$29",
                  period: "per month",
                  features: [
                    "Up to 500 students",
                    "Basic attendance tracking",
                    "Student management",
                    "Parent portal",
                    "Email support"
                  ],
                  popular: false
                },
                {
                  name: "Standard",
                  price: "$79",
                  period: "per month",
                  features: [
                    "Up to 2000 students",
                    "Advanced attendance & analytics",
                    "Complete student management",
                    "Online exams & grading",
                    "Priority support",
                    "API access"
                  ],
                  popular: true
                },
                {
                  name: "Premium",
                  price: "$149",
                  period: "per month",
                  features: [
                    "Unlimited students",
                    "All Standard features",
                    "Advanced reporting",
                    "Custom integrations",
                    "24/7 phone support",
                    "Dedicated account manager"
                  ],
                  popular: false
                }
              ].map((plan, index) => (
                <div key={index} className={`bg-white rounded-2xl shadow-lg border-2 ${plan.popular ? 'border-lamaSky ring-4 ring-lamaSkyLight/30' : 'border-gray-100'} hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-lamaSky to-lamaPurple text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-black text-lamaSky">{plan.price}</span>
                      <span className="text-lg font-medium text-gray-600">/{plan.period}</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className={`flex-shrink-0 w-6 h-6 ${plan.popular ? 'bg-lamaSky' : 'bg-lamaPurple'} rounded-full flex items-center justify-center mt-0.5`}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="ml-4 text-gray-700 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="relative">
                      <button className={`w-full px-6 py-4 text-lg font-bold rounded-xl transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-lamaSky to-lamaPurple text-white hover:shadow-xl hover:scale-105 shadow-lg'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md'
                      }`}>
                        Get Started
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="SchoolHub Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="ml-3 text-xl font-bold text-white">SchoolHub</span>
              </div>
              <p className="text-gray-400 text-base">
                Empowering schools with modern technology for better education and administration.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-300">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Solutions
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Student Management</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Teacher Portal</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Parent Access</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Admin Dashboard</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Documentation</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Help Center</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact Us</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Status</a></li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">About</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Blog</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Careers</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Press</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Privacy</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Terms</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Security</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Compliance</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 SchoolHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}