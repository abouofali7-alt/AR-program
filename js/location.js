/* ============================================================
   AR-Program — وحدة تحديد الموقع والخرائط التفاعلية (GPS Geolocation & Leaflet Maps)
   تحديد موقع العميل أو مكان التسليم على الخريطة التفاعلية وحفظ الإحداثيات والبحث التلقائي
   ============================================================ */

const ARLocation = (function () {
    let _leafletInstance = null;
    let _activeMarker = null;
    let _selectedCoords = null;
    let _selectedAddress = '';
    let _onSelectCallback = null;

    function parseCoordsOrQuery(param1, param2) {
        let query = '';
        let lat = null;
        let lng = null;

        if (typeof param1 === 'string') {
            query = param1.trim();
            const match = query.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        } else if (typeof param1 === 'number' && typeof param2 === 'number') {
            lat = param1;
            lng = param2;
        }

        return { query, lat, lng };
    }

    function openMapModal(param1, param2, param3) {
        let callback = null;
        let initialData = null;

        if (typeof param1 === 'function') {
            callback = param1;
        } else if (typeof param2 === 'function') {
            callback = param2;
            initialData = parseCoordsOrQuery(param1, null);
        } else if (typeof param3 === 'function') {
            callback = param3;
            initialData = parseCoordsOrQuery(param1, param2);
        } else {
            initialData = parseCoordsOrQuery(param1, param2);
        }

        _onSelectCallback = callback;

        let modal = document.getElementById('mapPickerModal');
        if (!modal) {
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            modal = document.createElement('div');
            modal.id = 'mapPickerModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);';
            modal.innerHTML = `
                <div style="background:var(--card-dark);border:1px solid var(--border-color);border-radius:14px;width:min(780px,94vw);height:580px;display:flex;flex-direction:column;box-shadow:var(--shadow-card);overflow:hidden;">
                    <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;background:var(--card-dark);">
                        <b style="font-size:1rem;color:var(--text-primary);"><i class="fa-solid fa-map-location-dot" style="color:var(--accent-cyan);"></i> تحديد الموقع والبحث التلقائي (GPS & Address Geocoder)</b>
                        <button onclick="document.getElementById('mapPickerModal').style.display='none'" class="icon-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div style="padding:10px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border-color);display:flex;gap:8px;align-items:center;">
                        <input id="mapSearchInput" placeholder="🔍 ابحث باسم المنطقة أو المدينة أو الإحداثيات (مثال: المعادي، القاهرة أو 30.0444, 31.2357)..." style="flex:1;background:var(--card-dark);border:1px solid var(--border-color);color:var(--text-primary);padding:8px 12px;border-radius:8px;font-size:0.88rem;outline:none;" onkeydown="if(event.key==='Enter')ARLocation.searchOnMap()">
                        <button class="btn btn-secondary" onclick="ARLocation.searchOnMap()" style="padding:8px 14px;font-size:0.85rem;"><i class="fa-solid fa-magnifying-glass" style="color:var(--accent-cyan);"></i> بحث</button>
                    </div>

                    <div id="leafletMapHost" style="flex:1;width:100%;background:#1e293b;position:relative;"></div>
                    
                    <div style="padding:12px 16px;border-top:1px solid var(--border-color);display:flex;align-items:center;justify-content:space-between;background:var(--header2-bg);flex-wrap:wrap;gap:8px;">
                        <div style="display:flex;flex-direction:column;gap:2px;max-width:65%;">
                            <span id="mapCoordsText" style="font-size:0.85rem;color:var(--text-primary);font-weight:600;"><i class="fa-solid fa-location-pin" style="color:var(--accent-cyan);"></i> الإحداثيات: جارِ التحديد...</span>
                            <span id="mapAddressText" style="font-size:0.75rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-secondary" onclick="ARLocation.useCurrentGPS()"><i class="fa-solid fa-crosshairs"></i> موقعي الحالي</button>
                            <button class="btn btn-primary-soft" id="mapConfirmBtn"><i class="fa-solid fa-check"></i> تأكيد الموقع</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';

        const searchInp = document.getElementById('mapSearchInput');
        if (searchInp && initialData && initialData.query && !initialData.lat) {
            searchInp.value = initialData.query;
        }

        if (typeof L === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => initLeafletMap(initialData);
            document.head.appendChild(script);
        } else {
            setTimeout(() => initLeafletMap(initialData), 100);
        }
    }

    function initLeafletMap(initialData) {
        let lat = (initialData && initialData.lat) || 30.0444;
        let lng = (initialData && initialData.lng) || 31.2357;

        const host = document.getElementById('leafletMapHost');
        if (!host) return;

        if (_leafletInstance) {
            _leafletInstance.remove();
            _leafletInstance = null;
        }

        _leafletInstance = L.map('leafletMapHost').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(_leafletInstance);

        _activeMarker = L.marker([lat, lng], { draggable: true }).addTo(_leafletInstance);
        setMarkerPosition(lat, lng, true);

        _leafletInstance.on('click', (e) => {
            setMarkerPosition(e.latlng.lat, e.latlng.lng, true);
        });

        _activeMarker.on('dragend', () => {
            const pos = _activeMarker.getLatLng();
            setMarkerPosition(pos.lat, pos.lng, true);
        });

        document.getElementById('mapConfirmBtn').onclick = () => {
            if (_onSelectCallback && _selectedCoords) {
                _onSelectCallback({
                    lat: _selectedCoords.lat,
                    lng: _selectedCoords.lng,
                    address: _selectedAddress
                });
            }
            document.getElementById('mapPickerModal').style.display = 'none';
        };

        if (initialData && initialData.query && !initialData.lat) {
            searchAddress(initialData.query);
        }
    }

    function setMarkerPosition(lat, lng, doReverseGeocode = false) {
        const fixedLat = parseFloat(lat).toFixed(6);
        const fixedLng = parseFloat(lng).toFixed(6);
        _selectedCoords = { lat: fixedLat, lng: fixedLng };

        if (_leafletInstance && _activeMarker) {
            _activeMarker.setLatLng([lat, lng]);
        }

        const label = document.getElementById('mapCoordsText');
        if (label) label.innerHTML = `<i class="fa-solid fa-location-pin" style="color:var(--accent-cyan);"></i> الإحداثيات: ${fixedLat}, ${fixedLng}`;

        if (doReverseGeocode) {
            reverseGeocode(lat, lng);
        }
    }

    function reverseGeocode(lat, lng) {
        const addrLabel = document.getElementById('mapAddressText');
        if (addrLabel) addrLabel.textContent = 'جاري جلب العنوان...';

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar,en`)
            .then(r => r.json())
            .then(data => {
                if (data && data.display_name) {
                    _selectedAddress = data.display_name;
                    if (addrLabel) addrLabel.textContent = 'العنوان: ' + data.display_name;
                } else {
                    if (addrLabel) addrLabel.textContent = '';
                }
            })
            .catch(() => {
                if (addrLabel) addrLabel.textContent = '';
            });
    }

    function searchAddress(query) {
        if (!query || !query.trim()) return;
        const q = query.trim();

        const match = q.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (_leafletInstance) _leafletInstance.setView([lat, lng], 15);
            setMarkerPosition(lat, lng, true);
            return;
        }

        const addrLabel = document.getElementById('mapAddressText');
        if (addrLabel) addrLabel.textContent = 'جاري البحث عن المكان: ' + q + '...';

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=ar,en`)
            .then(r => r.json())
            .then(results => {
                if (results && results.length > 0) {
                    const top = results[0];
                    const lat = parseFloat(top.lat);
                    const lng = parseFloat(top.lon);
                    _selectedAddress = top.display_name;
                    if (_leafletInstance) _leafletInstance.setView([lat, lng], 15);
                    setMarkerPosition(lat, lng, false);
                    if (addrLabel) addrLabel.textContent = 'العنوان: ' + top.display_name;
                } else {
                    if (addrLabel) addrLabel.textContent = 'لم يتم العثور على نتائج طابقت: ' + q;
                }
            })
            .catch(err => {
                console.error('Search error:', err);
                if (addrLabel) addrLabel.textContent = 'تعذر الاتصال بخدمة الخرائط';
            });
    }

    function searchOnMap() {
        const inp = document.getElementById('mapSearchInput');
        if (inp && inp.value) {
            searchAddress(inp.value);
        }
    }

    function useCurrentGPS() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                if (_leafletInstance) _leafletInstance.setView([lat, lng], 16);
                setMarkerPosition(lat, lng, true);
            }, () => {
                alert('تعذر تحديد الموقع الجغرافي الحالي، يرجى تفعيل الـ GPS بالمتصفح');
            });
        }
    }

    return { openMapModal, searchOnMap, searchAddress, useCurrentGPS };
})();

