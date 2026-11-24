import json, socket, datetime
from pyproj import Geod, Transformer
from shapely.geometry import Polygon
from shapely.ops import transform
p=Polygon([(500000,3200000),(500100,3200000),(500100,3200100),(500000,3200100)])
t=Transformer.from_crs(32643,4326,always_xy=True)
g=transform(t.transform,p)
a,_=Geod(ellps='WGS84').geometry_area_perimeter(g)
result={'synthetic':True,'projected_m2':p.area,'geodesic_m2':abs(a),'valid':p.is_valid,'status':'PASS' if p.is_valid and abs(p.area-10000)<1e-8 else 'FAIL'}
print(json.dumps(result,indent=2)); open('/mnt/data/ks_evidence/gis_result.json','w').write(json.dumps(result,indent=2))
logs=[]
for host in ['rest.isric.org','files.isric.org','desagri.gov.in']:
 try: value=str(socket.getaddrinfo(host,443)[0][4]); status='resolved'
 except OSError as e: value=str(e); status='failed'
 logs.append({'host':host,'status':status,'result':value})
open('/mnt/data/ks_evidence/dns_logs.json','w').write(json.dumps(logs,indent=2)); print(logs)
