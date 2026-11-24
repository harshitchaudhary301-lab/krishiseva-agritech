import csv, json, pathlib, hashlib, shutil
from shapely.geometry import Polygon
from shapely.ops import transform
import shapely, pyproj
from pyproj import Transformer, Geod
import matplotlib.pyplot as plt
p=pathlib.Path(__file__).parent; old=p/'Day01'; src=pathlib.Path('/mnt/data/ks_evidence')
if not old.exists(): shutil.copytree(src,old)
rows=list(csv.DictReader((old/'State master.csv').open()))
raw=[('Andhra Pradesh',8969,7374),('Arunachal Pradesh',431,296),('Assam',3304,2859),('Bihar',6560,6126),('Chhattisgarh',5564,4910),('Goa',141,132),('Gujarat',12234,10295),('Haryana',4030,3689),('Tamil Nadu',8104,5683),('Telangana',6728,6249),('Tripura',267,254),('Uttarakhand',1562,570),('Uttar Pradesh',18321,17403),('West Bengal',5577,5518),('Andaman and Nicobar Islands',23,12),('Chandigarh',1,1),('Dadra and Nagar Haveli and Daman and Diu',22,21),('Delhi',58,28),('Jammu and Kashmir',1097,831),('Ladakh',32,24),('Lakshadweep',2,2),('Puducherry',27,18)]
url='https://desagri.gov.in/wp-content/uploads/2026/06/LUS-2024-25.pdf'
def save(name,head,data):
 with (p/name).open('w',newline='') as f: w=csv.writer(f);w.writerow(head);w.writerows(data)
save('official_table_extract.csv',['Jurisdiction','Agricultural land (000 ha)','Cultivated land (000 ha)','Year','Source','Table','Acquisition'],[(*r,'2024-25 provisional',url,'IX p95','Manual transcription from web table') for r in raw])
save('land_analysis.csv',['Jurisdiction','Cultivated share %','Check cultivated <= agricultural'],[(n,round(c/a*100,2),0<=c<=a) for n,a,c in raw])
print('Rows',len(raw),'unique',len(set(r[0] for r in raw)),'valid',sum(0<=c<=a for n,a,c in raw))
print('Jurisdictions in old master:',[r['State / UT'] for r in rows])
T=Transformer.from_crs(32643,4326,always_xy=True); geod=Geod(ellps='WGS84'); base=(500000,3200000)
shapes={'square_1ha':([(0,0),(100,0),(100,100),(0,100)],10000),'small':([(0,0),(20,0),(20,30),(0,30)],600),'large':([(0,0),(400,0),(400,500),(0,500)],200000),'irregular':([(0,0),(100,0),(100,40),(40,40),(40,100),(0,100)],6400),'invalid':([(0,0),(100,100),(0,100),(100,0)],None),'overlap':([(50,50),(150,50),(150,150),(50,150)],10000)}
results=[]; polys={}; fig,axs=plt.subplots(2,3,figsize=(10,7))
for (name,(coords,exp)),ax in zip(shapes.items(),axs.flat):
 poly=Polygon([(base[0]+x,base[1]+y) for x,y in coords]);polys[name]=poly; valid=poly.is_valid; area=poly.area if valid else None; ga=abs(geod.geometry_area_perimeter(transform(T.transform,poly))[0]) if valid else None
 results.append(dict(name=name,coordinates=list(poly.exterior.coords),crs='EPSG:32643',valid=valid,expected_m2=exp,projected_m2=area,geodesic_m2=ga,difference_pct=(ga-area)/area*100 if valid else None,status='PASS' if (valid and abs(area-exp)<1e-7) or (not valid and exp is None) else 'FAIL'))
 x,y=poly.exterior.xy;ax.plot(x,y);ax.set_title(name);ax.set_aspect('equal');ax.ticklabel_format(useOffset=True)
fig.tight_layout();fig.savefig(p/'synthetic_polygons.png');plt.close(fig)
result={'shapely':shapely.__version__,'pyproj':pyproj.__version__,'tests':results,'overlap_m2':polys['square_1ha'].intersection(polys['overlap']).area,'expected_overlap_m2':2500};(p/'gis_results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
manifest=[]
for f in sorted(old.iterdir()): manifest.append([f.name,f.stat().st_size,hashlib.sha256(f.read_bytes()).hexdigest(),'Day01 original retained','2026-11-24 (reported creation)','File present; independent scientific verification pending'])
save('Day01_manifest.csv',['File','Bytes','SHA256','Source','Date','Status'],manifest)
