import urllib.request
import re
import os

try:
    html = urllib.request.urlopen("https://cdspecialtycontractors.com/").read().decode('utf-8')
    matches = re.findall(r'src="(https://cdspecialtycontractors\.com/[^"]*logo[^"]*\.png)"', html, re.IGNORECASE)
    if not matches:
        matches = re.findall(r'src="(https://cdspecialtycontractors\.com/[^"]*logo[^"]*\.svg)"', html, re.IGNORECASE)
        
    if matches:
        logo_url = matches[0]
        print("Found logo URL:", logo_url)
        dest = os.path.join(os.getcwd(), 'frontend', 'public', 'logo.png')
        urllib.request.urlretrieve(logo_url, dest)
        print("Downloaded successfully to", dest)
    else:
        print("Could not find logo URL on homepage.")
except Exception as e:
    print("Error:", e)
