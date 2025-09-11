import smtplib

server = smtplib.SMTP("smtp.mailgun.com", 587)
server.starttls()
server.login("E-Urun@sandboxd769ab420f654375aeabc477d3b38217.mailgun.org", "Zeynep@44@23")

print("Giriş başarılı!")
server.quit()