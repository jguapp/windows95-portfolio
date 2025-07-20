"use client"

export default function AboutMe() {
  return (
    <div className="bg-[#D8DFEA] text-black h-full overflow-auto">
      {/* TheFacebook header with integrated navigation */}
      <div className="w-full bg-[#3B5998]">
        <div className="relative h-[105px]">
          {/* Main header background with image */}
          <div className="absolute inset-0">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-05-08%20at%2012.01.06%E2%80%AFPM-9lLsGLf1afuQFfFORkGEuBYvKn6y6l.png"
              alt="TheFacebook Header"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Navigation links directly on top of the header */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end pr-40 space-x-6 text-white text-sm">
            <a href="#" className="hover:underline">
              home
            </a>
            <a href="#" className="hover:underline">
              search
            </a>
            <a href="#" className="hover:underline">
              global
            </a>
            <a href="#" className="hover:underline">
              social net
            </a>
            <a href="#" className="hover:underline">
              invite
            </a>
            <a href="#" className="hover:underline">
              faq
            </a>
            <a href="#" className="hover:underline">
              logout
            </a>
          </div>
        </div>
      </div>

      <div className="flex p-4 gap-4 h-[calc(100%-75px)] min-h-[calc(100vh-75px)]">
        {/* Left Sidebar */}
        <div className="w-48 flex flex-col gap-4 h-full relative">
          {/* Combined Quick Search and Advertisement Box */}
          <div className="flex flex-col">
            {/* Quick Search Box */}
            <div className="bg-white p-3 border border-[#B7B7B7] border-b-0">
              <div className="border border-dashed border-[#538ADC] p-2 mb-3">
                <div>
                  <input type="text" placeholder="" className="px-2 py-1 text-xs w-full border border-[#B7B7B7]" />
                </div>
                <div className="text-xs text-black mt-1 flex items-center">
                  <span>quick search</span>
                  <button className="bg-[#42a4f5] text-white px-2 py-0.5 text-xs ml-2 w-12">go</button>
                </div>
              </div>
              <ul className="text-[#42b3f5] text-sm space-y-1 border border-dashed border-[#538ADC] p-2">
                <li>
                  <a href="#" className="hover:underline">
                    My Profile [ edit ]
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Friends
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Groups
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Parties
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Messages
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Account
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Privacy
                  </a>
                </li>
              </ul>
            </div>

            {/* Advertisement Space - McDonald's 90s Ad */}
            <div
              className="bg-white border border-[#B7B7B7] flex flex-col flex-grow h-full overflow-hidden"
              style={{ minHeight: "calc(100vh - 290px)" }}
            >
              <div className="flex-1 flex items-stretch h-full">
                <div className="w-full h-full flex flex-col justify-center bg-white">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/McDonald%27s%20Ad-usiQBhenVMAReqbLa6tCSOzrN0CTxr.jpeg"
                    alt="McDonald's 90s Advertisement"
                    className="w-[200px] h-[492px] max-h-full"
                    style={{ objectPosition: "center" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Wrapped in a border with header */}
        <div className="flex-1">
          <div className="border border-[#B7B7B7] bg-white">
            {/* Main Profile Header */}
            <div className="flex w-full">
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1">
                Joel Vasquez&apos;s Profile
              </div>
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1 text-right">
                Baruch College
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-4 flex gap-4">
              {/* Left Column */}
              <div className="w-[300px] space-y-4">
                {/* Picture Section */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Picture</div>
                  <div className="p-3 flex justify-center">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Profile_Picture.JPG-uz5xQCY6mxXrGUPN6mEWfuoC04lhNe.jpeg"
                      alt="Profile"
                      className="w-[120px] h-[150px] object-cover"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-0">
                  <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
                    Send Joel a Message
                  </button>
                  <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
                    Poke Him!
                  </button>
                </div>

                {/* Connection */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Connection</div>
                  <div className="p-3 text-sm text-center">You are viewing Joel&apos;s profile.</div>
                </div>

                {/* Mutual Friends */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Mutual Friends</div>
                  <div className="p-3 text-sm">
                    You have <span className="text-[#42b3f5]">16 friends</span> in common.
                  </div>
                </div>

                {/* Friends */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Friends at Baruch College</div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Friend Grid - First Row */}
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Profile_Picture.JPG-mWrSBYriKwflyN8P2JrqR3n5XuiZ2k.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Finn
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0a3bb1327b9e5f47b8793c63542219da.jpg-Hzl5gtV8H1Uqk2RUWY329kCIJ77nwq.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Lelouch
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PLau5P3a_400x400.jpg-aZqFsH46iXU908LNgD7FSdha2JYrK3.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Cloud
                        </a>
                      </div>
                      {/* Friend Grid - Second Row */}
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d0547869a59f49cdcb23cf042d125d52.jpg-lpKhXNQ6POblUSoy5S2QDVZwVAmWT4.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Pancham
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6jgfqdqw0dkb1-2ktYcDWWJ014O8QFpsKPHv4CdEqhRD.png"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Aigis
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/a75a12a66a148b903918388091c9bdcd.jpg-rtxgZ6AE28ee1AXIovr0OdzxUFPp2K.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Vader
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Information */}
              <div className="flex-1">
                <div className="bg-white border border-[#B7B7B7] w-full h-[719px] overflow-auto">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Information</div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {/* Account Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Account Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4">Name:</td>
                              <td>Joel Vasquez</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Member Since:</td>
                              <td>February 4, 2004</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Last Update:</td>
                              <td>May 7, 2025</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Basic Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Basic Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4">School:</td>
                              <td className="text-[#42b3f5]">Baruch College '26</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Status:</td>
                              <td>Student</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Sex:</td>
                              <td className="text-[#42b3f5]">Male</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Residence:</td>
                              <td className="text-[#42b3f5]">New York, NY</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Birthday:</td>
                              <td>May 21st</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Contact Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4">Email:</td>
                              <td className="text-[#42b3f5]">jfvasq1@gmail.com</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Screename:</td>
                              <td className="text-[#42b3f5]">jguapp</td>
                            </tr>
                            <tr>
                              <td className="pr-4">Websites:</td>
                              <td className="text-[#42b3f5] break-words">
                                https://github.com/jguapp
                                <br />
                                https://www.linkedin.com/in/jvasquezcs/
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Personal Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Personal Info:</h5>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4 align-top w-1/4">Looking For:</td>
                              <td className="text-[#42b3f5]">Networking, Internship Opportunities</td>
                            </tr>
                            <tr>
                              <td className="pr-4 align-top w-1/4">Interested In:</td>
                              <td className="text-[#42b3f5]">Machine Learning, Data Science, Web Development</td>
                            </tr>
                            <tr>
                              <td className="pr-4 align-top w-1/4">Interests:</td>
                              <td className="text-[#42b3f5] break-words">
                                Reading, Writing, Open Source, Basketball, Legos, Watching Movies, Guitar, Gaming, Math,
                                Coding, Working Out, Sleeping
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Favorite Music */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4 align-top w-1/4">Favorite Music:</td>
                              <td className="text-[#42b3f5] break-words">
                                The Strokes, Arctic Monkeys, Radiohead, Mac Miller, Kendrick Lamar, Bob Dylan, Marvin
                                Gaye, Faye Webster, Stevie Wonder, Queen, Michael Jackson, Billy Joel, Tame Impala
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Favorite Movies */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4 align-top w-1/4">Favorite Movies:</td>
                              <td className="text-[#42b3f5] break-words">
                                Fantastic Mr. Fox, The Truman Show, The Grand Budapest Hotel, Pitch Perfect, Spiderman
                                2, Good Will Hunting, Star Wars
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* About Me */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="pr-4 align-top w-1/4">About Me:</td>
                              <td>
                                Hi there! I&apos;m Joel, a Computer Science student at Baruch College with a passion for
                                machine learning, data engineering, and web development. I&apos;m currently working as a
                                Data Engineer at CUNY Institute for Demographic Research while pursuing my degree.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
