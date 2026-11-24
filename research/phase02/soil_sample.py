# Requires rasterio, pyproj; run with actual authorized GeoTIFF and lon/lat. Untested on real data.
import argparse, rasterio, json
from pyproj import Transformer
p=argparse.ArgumentParser();p.add_argument('raster');p.add_argument('lon',type=float);p.add_argument('lat',type=float);a=p.parse_args()
with rasterio.open(a.raster) as ds:
 if not ds.crs: raise ValueError('Missing CRS')
 x,y=Transformer.from_crs('EPSG:4326',ds.crs,always_xy=True).transform(a.lon,a.lat)
 if not (ds.bounds.left<=x<ds.bounds.right and ds.bounds.bottom<y<=ds.bounds.top): raise ValueError('Outside raster')
 v=next(ds.sample([(x,y)],masked=True))[0]
 print(json.dumps({'crs':str(ds.crs),'resolution':ds.res,'nodata':ds.nodata,'raw_value':None if __import__('numpy').ma.is_masked(v) else float(v),'note':'Raw encoded regional estimate; consult product metadata for units and scaling'}))
