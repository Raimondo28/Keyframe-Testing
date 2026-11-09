#!/usr/bin/env python3
"""Cache an attributed, extent-checked Esri World Imagery export for the demo.

Uses inherited HTTPS proxy/CA settings. Does not disable verification or change
network access. Run again only after required network access is applied.
"""
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
import json
from math import pi, log, tan
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SERVICE = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
BOUNDS = {'west':115.68, 'east':115.96, 'south':-32.267, 'north':-32.12009051788834}
RADIUS = 6378137

def mercator(lon, lat):
    return [RADIUS*lon*pi/180, RADIUS*log(tan(pi/4+lat*pi/360))]

def get_json(url):
    with urlopen(url, timeout=30) as response:
        result = json.load(response)
    if 'error' in result:
        raise RuntimeError(str(result['error']))
    return result

def main():
    from PIL import Image
    metadata = get_json(SERVICE+'?f=pjson')
    extent = mercator(BOUNDS['west'],BOUNDS['south']) + mercator(BOUNDS['east'],BOUNDS['north'])
    parameters = {'bbox':','.join(map(str,extent)), 'bboxSR':'3857', 'imageSR':'3857', 'size':'1600,992', 'format':'jpg', 'f':'json'}
    export = get_json(SERVICE+'/export?'+urlencode(parameters))
    actual = export['extent']
    actual_values = [actual[k] for k in ['xmin','ymin','xmax','ymax']]
    if max(abs(a-b) for a,b in zip(extent,actual_values)) > 0.5:
        raise RuntimeError('Provider adjusted the image extent. Update map projection before using this image.')
    image_url = export['href']
    if not image_url.startswith('https://services.arcgisonline.com/'):
        raise RuntimeError('Unexpected image host. Review its network requirement before downloading: '+image_url.split('/')[2])
    with urlopen(image_url, timeout=45) as response:
        payload = response.read(10_000_001)
    if len(payload)>10_000_000:
        raise RuntimeError('Image exceeds the 10 MB demo limit.')
    with Image.open(BytesIO(payload)) as image:
        if image.format!='JPEG' or image.size!=(1600,992):
            raise RuntimeError('Unexpected satellite image format or dimensions.')
        image.verify()
    retrieved = datetime.now(timezone.utc).isoformat(timespec='seconds')
    attribution = metadata.get('copyrightText')
    if not attribution:
        raise RuntimeError('Provider attribution is missing; do not publish an unattributed image.')
    asset_dir=ROOT/'assets';asset_dir.mkdir(exist_ok=True)
    (asset_dir/'westport-satellite.jpg').write_bytes(payload)
    record={'provider':'Esri World Imagery','serviceUrl':SERVICE,'request':parameters,'bounds':BOUNDS,'extent':actual,'attribution':attribution,'retrievedAt':retrieved,'acquisitionDate':'Varies by location; not a live image','sha256':sha256(payload).hexdigest(),'bytes':len(payload)}
    (asset_dir/'westport-imagery.json').write_text(json.dumps(record,indent=2)+'\n')
    module={'imagePath':'assets/westport-satellite.jpg','attribution':attribution,'provider':'Esri World Imagery','serviceUrl':SERVICE,'acquisitionDate':record['acquisitionDate'],'retrievedAt':retrieved,'verified':True}
    (ROOT/'src/imagery.js').write_text('// Verified cached export; see assets/westport-imagery.json.\nexport const WESTPORT_IMAGERY = '+json.dumps(module,indent=2)+';\n')
    print(f'Cached {len(payload):,} bytes, verified extent and attribution. Rebuild OPEN-DEMO.html.')

if __name__=='__main__':
    main()
