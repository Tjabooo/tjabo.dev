import React from "react";
import Image from "next/image";
import Link from "next/link";
import contactImg from "../public/assets/contact.svg";
import { FaGithub, FaInstagram, FaLinkedin, FaDiscord } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { BsInstagram, BsPersonLinesFill } from "react-icons/bs";
import { HiOutlineChevronDoubleUp } from "react-icons/hi";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const Contact = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const isSwedish = router.locale === 'sv';
  const resumeLink = isSwedish ? '/sv-resume.pdf' : '/en-resume.pdf';

	const [formData, setFormData] = React.useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log(formData)
		try {
			// Send data to your secure API route
			const res = await fetch("/api/send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});
			if (!res.ok) {
				throw new Error("Failed to send message");
			}
			// Clear the form or display a success message
			setFormData({
				name: "",
				email: "",
				subject: "",
				message: "",
			});
		} catch (error) {
			console.error("Error:", error);
		}
	};

  const [copied, setCopied] = React.useState(false);
  const discordUsername = "isidorjp";

  const handleCopyDiscord = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(discordUsername)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = discordUsername;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }
  };

	return (
		<div id="contact" className="w-full lg:h-screen">
			<div className="max-w-[1240px] m-auto px-2 py-16 w-full">
				<h2 className="py-4 text-xl uppercase tracking-widest text-[#8839ef]">
					{t('contact.header')}
				</h2>
				<div className="grid lg:grid-cols-5 gap-8">
					{/* left */}

					<div className="col-span-2 lg:col-span-2 w-full h-full shadow-xl shadow-gray-900 rounded-xl p-4">
						<div className="lg:p-4 h-full">
							<div>
								<Image
									className="rounded-xl hover:scale-105 ease-in duration-300"
									src={contactImg}
									alt="/"
								/>
							</div>
							<div>
                <h2 className="py-2">{t('contact.name')}</h2>
								<p>{t('contact.title')}</p>
								<p className="py-4">
								  {t('contact.encouragement')}
								</p>
							</div>
							<div>
								<p className="uppercase pt-8">
								{t('contact.connect')}
								</p>
								<div className="flex items-center justify justify-between py-4">
									<a href="https://github.com/Tjabooo/" target="_blank" rel="noreferrer">
										<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
											<FaGithub />
										</div>
									</a>
									<a href="https://www.linkedin.com/in/oliver-j-p-i-westin-6670902a5/" target="_blank" rel="noreferrer">
										<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
											<FaLinkedin />
										</div>
									</a>
									<div className="relative">
										<div
										  onClick={handleCopyDiscord}
											className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]"
											title="Copy Discord Username"
										>
											<FaDiscord />
										</div>
										{copied && (
										  <div className="absolute -top-1 -right-1 bg-[#8839ef] rounded-full p-1">
												<FiCheck className="text-white" size={12} />
											</div>
										)}
									</div>
									<a target="_blank" href="https://instagram.com/olliiee__" rel="noreferrer">
										<div className="rounded-full shadow-lg shadow-gray-900 p-6 cursor-pointer hover:scale-110 ease-in duration-300 bg-[#262636]">
											<FaInstagram />
										</div>
									</a>
								</div>
							</div>
						</div>
					</div>
					{/* right */}

					<div className="col-span-3 w-full h-auto shadow-xl shadow-gray-900 rounded-xl lg:p-4">
						<div className="p-4">
							<form onSubmit={handleSubmit}>
								<div className="grid grid-cols-1 gap-4 w-full py-2">
									<div className="flex flex-col">
										<label className="uppercase text-sm py-2">{t('contact-form.name')}</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleChange}
											maxLength={100}
											className="border-2 rounded-lg p-3 flex border-gray-600 text-[#ecf0f5] bg-[#1a1a29]"
										/>
									</div>
								</div>
								<div className="flex flex-col py-2">
									<label className="uppercase text-sm py-2">{t('contact-form.email')}</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										maxLength={100}
										className="border-2 rounded-lg p-3 flex border-gray-600 text-[#ecf0f5] bg-[#1a1a29]"
									/>
								</div>
								<div className="flex flex-col py-2">
									<label className="uppercase text-sm py-2">{t('contact-form.subject')}</label>
									<input
										type="text"
										name="subject"
										value={formData.subject}
										onChange={handleChange}
										maxLength={300}
										className="border-2 rounded-lg p-3 flex border-gray-600 text-[#ecf0f5] bg-[#1a1a29]"
									/>
								</div>
								<div className="flex flex-col py-2">
									<label className="uppercase text-sm py-2">{t('contact-form.message')}</label>
									<textarea
										name="message"
										rows="10"
										value={formData.message}
										onChange={handleChange}
										maxLength={1500}
										className="border-2 rounded-lg p-3 border-gray-600 text-[#ecf0f5] bg-[#1a1a29]"
									></textarea>
								</div>
								<button
									data-mdb-ripple="true"
									data-mdb-ripple-color="light"
									type="submit"
									className="w-full p-4 text-gray-100 mt-4"
								>
									{t('contact-form.submit')}
								</button>
							</form>
						</div>
					</div>
				</div>
				<div className="flex justify-center py-12">
					<Link href="/">
						<div className="rounded-full shadow-lg shadow-gray-900 p-4 cursor-pointer hover:scale-110 ease-in duration-300">
							<HiOutlineChevronDoubleUp className="text-[#8839ef]" size={30} />
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default Contact;
