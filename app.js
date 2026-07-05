/* ==========================================================================
   GEMSA Technical Report Generator - Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements Selection ---
    
    // Form inputs
    const fieldClient = document.getElementById('field-client');
    const fieldCode = document.getElementById('field-code');
    const fieldDate = document.getElementById('field-date');
    const fieldName = document.getElementById('field-name');
    const fieldContact = document.getElementById('field-contact');
    const fieldDescription = document.getElementById('field-description');
    const fieldConclusions = document.getElementById('field-conclusions');
    
    // Dynamic Photos elements
    const photosEditorList = document.getElementById('photos-editor-list');
    const photosPreviewList = document.getElementById('photos-preview-list');

    // Action buttons
    const btnPrint = document.getElementById('btn-print');
    const btnExport = document.getElementById('btn-export');
    const inputImport = document.getElementById('input-import');
    const btnReset = document.getElementById('btn-reset');
    const btnGenCode = document.getElementById('btn-gen-code');
    const btnSaveDraft = document.getElementById('btn-save-draft');
    const draftsListContainer = document.getElementById('drafts-list');
    const btnAddPhoto = document.getElementById('btn-add-photo');
    
    // Document Preview elements
    const prevClient = document.getElementById('prev-client');
    const prevCode = document.getElementById('prev-code');
    const prevDate = document.getElementById('prev-date');
    const prevName = document.getElementById('prev-name');
    const prevContact = document.getElementById('prev-contact');
    const prevDescription = document.getElementById('prev-description');
    const prevConclusions = document.getElementById('prev-conclusions');
    
    const toastElement = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // --- State Variables ---
    let reportData = {
        client: '',
        code: '',
        date: '',
        name: '',
        contact: '',
        description: '',
        conclusions: '',
        photos: []
    };

    const defaultImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' font-family='sans-serif' font-size='14' fill='%2394a3b8' dominant-baseline='middle' text-anchor='middle'>SELECCIONAR FOTO</text></svg>";

    // --- Core Functions ---

    // Get current local date/time string formatted as YYYY-MM-DDThh:mm
    function getLocalDateTimeString() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Initialize Default Dates
    function initDefaultDates() {
        const now = new Date();
        
        // Formatear fecha YYYY-MM-DD
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${year}-${month}-${day}`;
        
        fieldDate.value = dateString;
        reportData.date = dateString;
        
        // Generate report code automatically if empty
        if (!reportData.code) {
            generateReportCodeSilent();
        }

        // Add one default photo if photos array is empty
        if (reportData.photos.length === 0) {
            addNewPhoto("Foto 1");
        }
        
        updatePreview();
    }

    // Generate Code (Format: IT-YYYY-RANDOM)
    function generateReportCodeSilent() {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digitos
        const generatedCode = `IT-${year}-${randomNum}`;
        fieldCode.value = generatedCode;
        reportData.code = generatedCode;
        updatePreview();
        autosaveCurrentState();
    }

    // Generate Code with toast notification
    function generateReportCode() {
        generateReportCodeSilent();
        showToast("Código del reporte generado automáticamente");
    }

    // Format Date for preview (e.g., "03 de Julio de 2026")
    function formatDateSpan(dateStr) {
        if (!dateStr) return '[Día de la generación]';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    // Format DateTime for photo preview (e.g., "DD/MM/AAAA HH:MM")
    function formatDateTimeSpan(dateTimeStr) {
        if (!dateTimeStr) return '[DD/MM/AAAA]';
        const parts = dateTimeStr.split('T');
        if (parts.length !== 2) return dateTimeStr;
        
        const dateParts = parts[0].split('-');
        const timeParts = parts[1].split(':');
        
        if (dateParts.length !== 3) return dateTimeStr;
        
        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
    }

    // Add New Photo to State and render
    function addNewPhoto(title = "") {
        const id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const datetime = getLocalDateTimeString();
        const photoTitle = title || `Foto ${reportData.photos.length + 1}`;
        reportData.photos.push({
            id: id,
            title: photoTitle,
            base64: '',
            description: '',
            datetime: datetime
        });
        renderEditorPhotos();
        updatePreview();
        autosaveCurrentState();
    }

    // Dynamic Photo Editor List rendering
    function renderEditorPhotos() {
        photosEditorList.innerHTML = '';
        
        if (reportData.photos.length === 0) {
            photosEditorList.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px 0;">No hay fotos agregadas. Haz clic en "Agregar Foto".</p>';
            return;
        }

        reportData.photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'photo-editor-item';
            item.dataset.id = photo.id;
            
            const currentTitle = photo.title || `Foto ${index + 1}`;

            item.innerHTML = `
                <div class="photo-editor-header">
                    <input type="text" class="photo-title-input" value="${currentTitle}" placeholder="Ej. Foto del equipo" title="Click para editar el título">
                    <button class="btn-remove-photo-item" title="Eliminar esta foto">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                
                <div class="drag-drop-zone ${photo.base64 ? '' : 'no-image'}" id="drop-zone-${photo.id}">
                    <input type="file" id="file-${photo.id}" accept="image/*" class="file-hidden">
                    <i class="fa-solid fa-cloud-arrow-up drop-icon ${photo.base64 ? 'hidden' : ''}"></i>
                    <p class="drop-text ${photo.base64 ? 'hidden' : ''}">Arrastra una imagen o <span>haz clic para buscar</span></p>
                    <img class="upload-preview ${photo.base64 ? '' : 'hidden'}" src="${photo.base64 || ''}" alt="Vista previa">
                </div>

                <div class="form-group mt-2">
                    <div class="label-row">
                        <label>Descripción de la Foto</label>
                        <button type="button" class="btn-ai-desc-photo ${photo.base64 ? '' : 'hidden'}" data-id="${photo.id}" title="Describir imagen con IA">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> IA: Describir
                        </button>
                    </div>
                    <input type="text" class="photo-desc-input form-control form-control-sm" value="${photo.description || ''}" placeholder="Ej. Detalle del trabajo realizado">
                </div>

                <div class="form-group">
                    <label>Fecha / Hora de Captura</label>
                    <input type="datetime-local" class="photo-date-input form-control form-control-sm" value="${photo.datetime || ''}">
                </div>
                
                <button class="btn btn-sm btn-outline-danger w-100 mt-2 btn-remove-image ${photo.base64 ? '' : 'hidden'}" title="Eliminar solo la imagen">
                    <i class="fa-solid fa-image-slash"></i> Eliminar Imagen
                </button>
            `;

            // Query elements inside this item
            const fileInput = item.querySelector(`#file-${photo.id}`);
            const dropZone = item.querySelector(`#drop-zone-${photo.id}`);
            const previewImg = item.querySelector('.upload-preview');
            const dropIcon = item.querySelector('.drop-icon');
            const dropText = item.querySelector('.drop-text');
            const titleInput = item.querySelector('.photo-title-input');
            const descInput = item.querySelector('.photo-desc-input');
            const dateInput = item.querySelector('.photo-date-input');
            const btnRemoveImg = item.querySelector('.btn-remove-image');
            const btnRemoveItem = item.querySelector('.btn-remove-photo-item');
            const btnAiDesc = item.querySelector('.btn-ai-desc-photo');

            // Bind events for title
            titleInput.addEventListener('input', (e) => {
                photo.title = e.target.value;
                updatePreview();
                autosaveCurrentState();
            });

            // Bind events for description
            descInput.addEventListener('input', (e) => {
                photo.description = e.target.value;
                updatePreview();
                autosaveCurrentState();
            });

            // Bind events for date
            dateInput.addEventListener('input', (e) => {
                photo.datetime = e.target.value;
                updatePreview();
                autosaveCurrentState();
            });

            // Remove entire photo item
            btnRemoveItem.addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que deseas eliminar la "${currentTitle}"?`)) {
                    reportData.photos.splice(index, 1);
                    renderEditorPhotos();
                    updatePreview();
                    autosaveCurrentState();
                    showToast("Foto eliminada del informe");
                }
            });

            // Remove image only
            btnRemoveImg.addEventListener('click', (e) => {
                e.stopPropagation();
                photo.base64 = '';
                fileInput.value = '';
                previewImg.src = '';
                previewImg.classList.add('hidden');
                btnRemoveImg.classList.add('hidden');
                dropIcon.classList.remove('hidden');
                dropText.classList.remove('hidden');
                if (btnAiDesc) btnAiDesc.classList.add('hidden');
                updatePreview();
                autosaveCurrentState();
            });

            // Bind AI Description button click
            if (btnAiDesc) {
                btnAiDesc.addEventListener('click', async () => {
                    if (!photo.base64) {
                        showToast("Suba una imagen primero", true);
                        return;
                    }
                    
                    const originalBtnContent = btnAiDesc.innerHTML;
                    btnAiDesc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Describiendo...';
                    btnAiDesc.disabled = true;
                    
                    try {
                        const description = await describePhotoWithAI(photo.base64);
                        photo.description = description;
                        descInput.value = description;
                        updatePreview();
                        autosaveCurrentState();
                        showToast("Foto descrita con éxito");
                    } catch (error) {
                        console.error("AI photo description failed:", error);
                        showToast(`Error de IA: ${error.message}`, true);
                    } finally {
                        btnAiDesc.innerHTML = originalBtnContent;
                        btnAiDesc.disabled = false;
                    }
                });
            }

            // Setup drag and drop for this dynamic item
            setupDynamicDragAndDrop(dropZone, fileInput, photo, previewImg, btnRemoveImg, dropIcon, dropText, btnAiDesc);

            photosEditorList.appendChild(item);
        });
    }

    // Setup drag and drop events for a dynamic zone
    function setupDynamicDragAndDrop(dropZone, fileInput, photo, previewImg, btnRemoveImg, dropIcon, dropText, btnAiDesc) {
        // Drag events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            }, false);
        });

        // Drop file
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleDynamicImageUpload(files[0], photo, previewImg, btnRemoveImg, dropIcon, dropText, btnAiDesc);
            }
        }, false);

        // Click zone trigger input
        dropZone.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.closest('.btn-remove-image') || e.target.closest('.btn-remove-photo-item')) return;
            fileInput.click();
        });

        // File input changed
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files.length > 0) {
                handleDynamicImageUpload(fileInput.files[0], photo, previewImg, btnRemoveImg, dropIcon, dropText, btnAiDesc);
            }
        });
    }

    // Handle dynamic image upload
    function handleDynamicImageUpload(file, photo, previewImg, btnRemoveImg, dropIcon, dropText, btnAiDesc) {
        if (!file || !file.type.startsWith('image/')) {
            showToast("Error: El archivo seleccionado no es una imagen válida", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            photo.base64 = base64;
            
            // Update editor DOM
            previewImg.src = base64;
            previewImg.classList.remove('hidden');
            btnRemoveImg.classList.remove('hidden');
            dropIcon.classList.add('hidden');
            dropText.classList.add('hidden');
            if (btnAiDesc) btnAiDesc.classList.remove('hidden');
            
            updatePreview();
            autosaveCurrentState();
        };
        reader.readAsDataURL(file);
    }

    // Dynamic Photo Preview List rendering
    function renderPreviewPhotos() {
        photosPreviewList.innerHTML = '';
        
        if (reportData.photos.length === 0) {
            photosPreviewList.innerHTML = '<p style="grid-column: span 2; text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 30px 0; border: 1.5px dashed #cbd5e1; border-radius: 4px;">No se han agregado fotografías al informe.</p>';
            return;
        }

        reportData.photos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            const currentTitle = photo.title || `Foto ${index + 1}`;
            const headerClass = index % 2 === 0 ? 'bg-before' : 'bg-after'; // Alternating colors
            const formattedDate = formatDateTimeSpan(photo.datetime);
            const imgSrc = photo.base64 || defaultImg;

            card.innerHTML = `
                <div class="photo-card-header ${headerClass}">[ ${currentTitle.toUpperCase()} ]</div>
                <div class="photo-card-img-wrapper">
                    <img src="${imgSrc}" alt="${currentTitle}">
                </div>
                <div class="photo-card-body">
                    <div class="photo-desc">
                        <strong>${currentTitle}:</strong> <span>${photo.description || '[Sin descripción]'}</span>
                    </div>
                    <div class="photo-meta">
                        <i class="fa-regular fa-clock"></i> <strong>Fecha / Hora:</strong> <span>${formattedDate}</span>
                    </div>
                </div>
            `;
            
            photosPreviewList.appendChild(card);
        });
    }

    // Update A4 Preview Sheet
    function updatePreview() {
        // Text sync
        prevClient.textContent = reportData.client || '[Nombre del Cliente / Empresa]';
        prevCode.textContent = reportData.code || '[IT-2026-XXXX]';
        prevName.textContent = reportData.name || '[Título del Servicio Ejecutado]';
        prevDate.textContent = formatDateSpan(reportData.date);
        prevContact.textContent = reportData.contact || '[Nombre / Teléfono / Correo del Contacto]';
        
        // Keep descriptions and conclusions safe but preserve newlines
        prevDescription.textContent = reportData.description || '[Detalle minuciosamente las especificaciones técnicas del trabajo, el estado inicial del área evaluada, la metodología aplicada, las herramientas/materiales utilizados y las actividades paso a paso ejecutadas por el equipo.]';
        prevConclusions.textContent = reportData.conclusions || '[Indique los comentarios de cierre técnico y las recomendaciones preventivas de uso para el cliente final.]';
        
        // Photos
        renderPreviewPhotos();
    }

    // Migrate old report formats
    function migrateOldReportData(data) {
        if (!data) return data;
        
        // If photos is missing but old photo keys exist
        if (!data.photos && (data.photo1 || data.photo2)) {
            data.photos = [];
            if (data.photo1 && (data.photo1.base64 || data.photo1.description)) {
                data.photos.push({
                    id: 'photo-old-1',
                    title: 'Foto 1',
                    base64: data.photo1.base64 || '',
                    description: data.photo1.description || '',
                    datetime: data.photo1.datetime || ''
                });
            }
            if (data.photo2 && (data.photo2.base64 || data.photo2.description)) {
                data.photos.push({
                    id: 'photo-old-2',
                    title: 'Foto 2',
                    base64: data.photo2.base64 || '',
                    description: data.photo2.description || '',
                    datetime: data.photo2.datetime || ''
                });
            }
            delete data.photo1;
            delete data.photo2;
        }
        
        if (!data.photos) {
            data.photos = [];
        }
        
        return data;
    }

    // --- Input Synchronizations ---
    const bindInput = (inputEl, dataField) => {
        inputEl.addEventListener('input', (e) => {
            reportData[dataField] = e.target.value;
            updatePreview();
            autosaveCurrentState();
        });
    };

    bindInput(fieldClient, 'client');
    bindInput(fieldCode, 'code');
    bindInput(fieldDate, 'date');
    bindInput(fieldName, 'name');
    bindInput(fieldContact, 'contact');
    bindInput(fieldDescription, 'description');
    bindInput(fieldConclusions, 'conclusions');

    // Add Photo Button click
    btnAddPhoto.addEventListener('click', () => {
        addNewPhoto();
    });

    // Abrir Archivo trigger
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    if (btnImportTrigger) {
        btnImportTrigger.addEventListener('click', () => {
            inputImport.click();
        });
    }

    // --- Actions ---

    // Print
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Export JSON
    btnExport.addEventListener('click', () => {
        if (!reportData.client && !reportData.code && !reportData.name) {
            showToast("El informe está vacío. Complete algunos campos antes de guardar el archivo.", true);
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchor = document.createElement('a');
        const fileName = `${reportData.code || 'IT-SIN-CODIGO'}_${(reportData.client || 'CLIENTE').replace(/\s+/g, '_')}.json`;
        
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Informe guardado en archivo JSON");
    });

    // Import JSON
    inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                let parsedData = JSON.parse(evt.target.result);
                parsedData = migrateOldReportData(parsedData);
                
                reportData = {
                    client: parsedData.client || '',
                    code: parsedData.code || '',
                    date: parsedData.date || '',
                    name: parsedData.name || '',
                    contact: parsedData.contact || '',
                    description: parsedData.description || '',
                    conclusions: parsedData.conclusions || '',
                    photos: parsedData.photos || []
                };

                // Update form values
                fieldClient.value = reportData.client;
                fieldCode.value = reportData.code;
                fieldDate.value = reportData.date;
                fieldName.value = reportData.name;
                fieldContact.value = reportData.contact;
                fieldDescription.value = reportData.description;
                fieldConclusions.value = reportData.conclusions;
                
                // Sync UI
                renderEditorPhotos();
                updatePreview();
                autosaveCurrentState();
                showToast("Archivo abierto con éxito");
            } catch (err) {
                showToast("Error al abrir: archivo JSON inválido", true);
                console.error(err);
            }
            // Reset import input so same file can be uploaded again
            inputImport.value = '';
        };
        reader.readAsText(file);
    });

    // Reset Form
    btnReset.addEventListener('click', () => {
        if (confirm("¿Está seguro de que desea restablecer el formulario? Se borrarán todos los cambios actuales.")) {
            clearForm();
            showToast("Formulario restablecido");
        }
    });

    // Generate Code click
    btnGenCode.addEventListener('click', () => {
        generateReportCode();
    });

    // Clear function
    function clearForm() {
        reportData = {
            client: '',
            code: '',
            date: '',
            name: '',
            contact: '',
            description: '',
            conclusions: '',
            photos: []
        };

        fieldClient.value = '';
        fieldCode.value = '';
        fieldName.value = '';
        fieldContact.value = '';
        fieldDescription.value = '';
        fieldConclusions.value = '';
        
        initDefaultDates();
        renderEditorPhotos();
        updatePreview();
        autosaveCurrentState();
    }

    // --- Toast Notification Helper ---
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        
        if (isError) {
            toastElement.style.borderLeft = "5px solid var(--danger)";
            toastElement.querySelector('.toast-icon').className = "fa-solid fa-circle-exclamation toast-icon";
            toastElement.querySelector('.toast-icon').style.color = "var(--danger)";
        } else {
            toastElement.style.borderLeft = "5px solid var(--success)";
            toastElement.querySelector('.toast-icon').className = "fa-solid fa-circle-check toast-icon";
            toastElement.querySelector('.toast-icon').style.color = "var(--success)";
        }
        
        toastElement.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toastElement.classList.add('hidden');
        }, 3000);
    }

    // --- Drafts & Autosave ---

    // Autosave current form state to LocalStorage
    function autosaveCurrentState() {
        localStorage.setItem('gemsa_report_autosave', JSON.stringify(reportData));
    }

    // Load autosaved draft if exists
    function loadAutosave() {
        const savedData = localStorage.getItem('gemsa_report_autosave');
        if (savedData) {
            try {
                let parsed = JSON.parse(savedData);
                parsed = migrateOldReportData(parsed);
                reportData = parsed;
                
                // Form mappings
                fieldClient.value = reportData.client || '';
                fieldCode.value = reportData.code || '';
                fieldDate.value = reportData.date || '';
                fieldName.value = reportData.name || '';
                fieldContact.value = reportData.contact || '';
                fieldDescription.value = reportData.description || '';
                fieldConclusions.value = reportData.conclusions || '';
                
                renderEditorPhotos();
                updatePreview();
            } catch (e) {
                console.error("No se pudo cargar el borrador autoguardado", e);
                initDefaultDates();
            }
        } else {
            initDefaultDates();
        }
    }

    // Save a draft permanently into LocalStorage
    btnSaveDraft.addEventListener('click', () => {
        if (!reportData.client && !reportData.name) {
            showToast("Complete al menos el Cliente o el Servicio para guardar un borrador", true);
            return;
        }

        const drafts = getDrafts();
        const draftId = reportData.code || `draft-${Date.now()}`;
        
        // Overwrite or create new
        drafts[draftId] = {
            id: draftId,
            timestamp: Date.now(),
            data: reportData
        };

        localStorage.setItem('gemsa_report_drafts', JSON.stringify(drafts));
        renderDraftsList();
        showToast("Borrador guardado exitosamente");
    });

    // Helper: get list of drafts
    function getDrafts() {
        const draftsRaw = localStorage.getItem('gemsa_report_drafts');
        return draftsRaw ? JSON.parse(draftsRaw) : {};
    }

    // Render Drafts into sidebar panel
    function renderDraftsList() {
        const drafts = getDrafts();
        const draftIds = Object.keys(drafts).sort((a, b) => drafts[b].timestamp - drafts[a].timestamp);
        
        if (draftIds.length === 0) {
            draftsListContainer.innerHTML = '<p class="no-drafts-text">No hay borradores guardados localmente.</p>';
            return;
        }

        draftsListContainer.innerHTML = '';
        
        draftIds.forEach(id => {
            const draft = drafts[id];
            const item = document.createElement('div');
            item.className = 'draft-item';
            
            const dateObj = new Date(draft.timestamp);
            const formattedTime = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
            
            item.innerHTML = `
                <div class="draft-info">
                    <span class="draft-title" title="${draft.data.client || 'Sin Cliente'}">${draft.data.client || 'Sin Cliente'}</span>
                    <span class="draft-meta">${draft.data.name || 'Sin Título'} | ${formattedTime}</span>
                </div>
                <button class="btn-draft-del" title="Eliminar borrador"><i class="fa-solid fa-trash-can"></i></button>
            `;
            
            // Load draft click
            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-draft-del')) return; // ignore delete click
                
                if (confirm(`¿Cargar el borrador para ${draft.data.client || 'Sin Cliente'}? Se reemplazarán los datos actuales.`)) {
                    let draftData = JSON.parse(JSON.stringify(draft.data));
                    draftData = migrateOldReportData(draftData);
                    reportData = draftData;
                    
                    fieldClient.value = reportData.client;
                    fieldCode.value = reportData.code;
                    fieldDate.value = reportData.date;
                    fieldName.value = reportData.name;
                    fieldContact.value = reportData.contact;
                    fieldDescription.value = reportData.description;
                    fieldConclusions.value = reportData.conclusions;
                    
                    renderEditorPhotos();
                    updatePreview();
                    autosaveCurrentState();
                    showToast("Borrador cargado");
                }
            });
            
            // Delete draft click
            item.querySelector('.btn-draft-del').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("¿Está seguro de que desea eliminar este borrador?")) {
                    const currentDrafts = getDrafts();
                    delete currentDrafts[id];
                    localStorage.setItem('gemsa_report_drafts', JSON.stringify(currentDrafts));
                    renderDraftsList();
                    showToast("Borrador eliminado");
                }
            });
            
            draftsListContainer.appendChild(item);
        });
    }

    // --- Mobile Tabs Logic ---
    const tabEditMode = document.getElementById('tab-edit-mode');
    const tabPreviewMode = document.getElementById('tab-preview-mode');
    const appContainer = document.getElementById('app-container');

    if (tabEditMode && tabPreviewMode && appContainer) {
        tabEditMode.addEventListener('click', () => {
            tabEditMode.classList.add('active');
            tabPreviewMode.classList.remove('active');
            appContainer.classList.remove('show-preview');
        });

        tabPreviewMode.addEventListener('click', () => {
            tabPreviewMode.classList.add('active');
            tabEditMode.classList.remove('active');
            appContainer.classList.add('show-preview');
        });
    }

    // --- Real-time Preview Toggle (Desktop) ---
    const chkShowPreview = document.getElementById('chk-show-preview');
    if (chkShowPreview && appContainer) {
        // Load initial preference from LocalStorage
        const savedToggle = localStorage.getItem('gemsa_show_preview_desktop');
        if (savedToggle !== null) {
            const isChecked = savedToggle === 'true';
            chkShowPreview.checked = isChecked;
            if (!isChecked) {
                appContainer.classList.add('hide-preview-desktop');
            }
        }

        chkShowPreview.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem('gemsa_show_preview_desktop', isChecked);
            if (isChecked) {
                appContainer.classList.remove('hide-preview-desktop');
            } else {
                appContainer.classList.add('hide-preview-desktop');
            }
        });
    }

    // --- Speech Recognition (Voice Input) ---
    const voiceButtons = document.querySelectorAll('.btn-voice');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        let activeTextarea = null;
        let activeBtn = null;
        let isRecognizing = false;

        recognition.onstart = () => {
            isRecognizing = true;
            if (activeBtn) {
                activeBtn.classList.add('recording');
                const icon = activeBtn.querySelector('i');
                if (icon) {
                    icon.className = "fa-solid fa-microphone-slash";
                }
            }
            showToast("Escuchando... hable ahora");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (activeTextarea) {
                const startPos = activeTextarea.selectionStart;
                const endPos = activeTextarea.selectionEnd;
                const originalText = activeTextarea.value;
                
                const beforeText = originalText.substring(0, startPos);
                const afterText = originalText.substring(endPos);
                const prefixSpace = (beforeText.length > 0 && !beforeText.endsWith(' ')) ? ' ' : '';
                
                activeTextarea.value = beforeText + prefixSpace + transcript + afterText;
                
                const newCursorPos = startPos + prefixSpace.length + transcript.length;
                activeTextarea.setSelectionRange(newCursorPos, newCursorPos);
                
                // Dispatch input event to update reportData state and preview
                const inputEvent = new Event('input', { bubbles: true });
                activeTextarea.dispatchEvent(inputEvent);
                
                showToast("Texto agregado por dictado de voz");
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                showToast("Error: Acceso al micrófono denegado", true);
            } else if (event.error === 'no-speech') {
                showToast("No se escuchó ninguna voz", true);
            } else {
                showToast(`Error de micrófono: ${event.error}`, true);
            }
            stopSpeechRecognition();
        };

        recognition.onend = () => {
            stopSpeechRecognition();
        };

        function stopSpeechRecognition() {
            isRecognizing = false;
            if (activeBtn) {
                activeBtn.classList.remove('recording');
                const icon = activeBtn.querySelector('i');
                if (icon) {
                    icon.className = "fa-solid fa-microphone";
                }
            }
            activeBtn = null;
            activeTextarea = null;
            try {
                recognition.stop();
            } catch (e) {}
        }

        voiceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const textarea = document.getElementById(targetId);
                
                if (!textarea) return;

                if (isRecognizing) {
                    const isSame = (activeBtn === btn);
                    stopSpeechRecognition();
                    
                    if (!isSame) {
                        startRecognitionFor(btn, textarea);
                    }
                } else {
                    startRecognitionFor(btn, textarea);
                }
            });
        });

        function startRecognitionFor(btn, textarea) {
            activeBtn = btn;
            activeTextarea = textarea;
            try {
                recognition.start();
            } catch (err) {
                console.error("Failed to start speech recognition:", err);
                showToast("Error al iniciar dictado por voz", true);
                stopSpeechRecognition();
            }
        }
    } else {
        // Hide mic buttons if Speech Recognition is not supported by browser
        voiceButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        console.warn("Speech Recognition API is not supported in this browser.");
    }

    // --- AI Assistant Logic ---
    const fieldApiKey = document.getElementById('field-api-key');
    const btnToggleApiKey = document.getElementById('btn-toggle-api-key');
    const btnTestConnection = document.getElementById('btn-test-connection');
    const aiConnectionStatus = document.getElementById('ai-connection-status');

    const btnAiImproveDesc = document.getElementById('btn-ai-improve-desc');
    const btnAiExpandDesc = document.getElementById('btn-ai-expand-desc');
    const btnAiGenConclusions = document.getElementById('btn-ai-gen-conclusions');
    const btnAiImproveConclusions = document.getElementById('btn-ai-improve-conclusions');

    // Retrieve key
    function getApiKey() {
        return localStorage.getItem('gemsa_openai_api_key') || '';
    }

    // Set UI value of API Key
    function initApiKeyUI() {
        const key = getApiKey();
        if (fieldApiKey) {
            fieldApiKey.value = key;
            if (key) {
                updateStatusBadge('offline', 'Listo');
            } else {
                updateStatusBadge('offline', 'Sin configurar');
            }
        }
    }

    function updateStatusBadge(status, message = '') {
        if (!aiConnectionStatus) return;
        
        aiConnectionStatus.className = 'status-badge';
        
        if (status === 'offline') {
            aiConnectionStatus.classList.add('status-offline');
            aiConnectionStatus.textContent = message || 'Listo';
        } else if (status === 'connecting') {
            aiConnectionStatus.classList.add('status-connecting');
            aiConnectionStatus.textContent = message || 'Conectando...';
        } else if (status === 'online') {
            aiConnectionStatus.classList.add('status-online');
            aiConnectionStatus.textContent = message || 'Conectado';
        }
    }

    async function callOpenAI(messages, maxTokens = 1000) {
        const apiKey = fieldApiKey ? fieldApiKey.value.trim() : getApiKey();
        if (!apiKey) {
            throw new Error("API Key no configurada.");
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMessage = errData.error?.message || `Error HTTP ${response.status}`;
            throw new Error(errMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    async function describePhotoWithAI(base64DataUrl) {
        const apiKey = fieldApiKey ? fieldApiKey.value.trim() : getApiKey();
        if (!apiKey) {
            throw new Error("API Key no configurada.");
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un técnico senior en inspecciones de GEMSA. Tu labor es observar la imagen provista y redactar una descripción técnica concisa (máximo 15-20 palabras) para un reporte fotográfico. Identifica los elementos principales, el estado de los componentes o la acción realizada. Responde directamente con la descripción técnica breve en español, sin preámbulos.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Describe esta fotografía técnica de manera concisa:'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: base64DataUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 150,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMessage = errData.error?.message || `Error HTTP ${response.status}`;
            throw new Error(errMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    async function testOpenAIConnection() {
        updateStatusBadge('connecting', 'Probando...');
        if (btnTestConnection) btnTestConnection.disabled = true;
        
        try {
            const reply = await callOpenAI([
                { role: 'user', content: 'Responde solo con la palabra OK.' }
            ], 10);
            
            if (reply.toUpperCase().includes('OK')) {
                updateStatusBadge('online');
                showToast("Conexión con OpenAI exitosa");
            } else {
                throw new Error("Respuesta inesperada de la API");
            }
        } catch (error) {
            console.error("Connection test failed:", error);
            updateStatusBadge('offline', 'Error');
            showToast(`Error de conexión: ${error.message}`, true);
        } finally {
            if (btnTestConnection) btnTestConnection.disabled = false;
        }
    }

    async function handleImproveDescription() {
        const desc = fieldDescription.value.trim();
        if (!desc) {
            showToast("La descripción técnica está vacía", true);
            return;
        }

        const originalBtnText = btnAiImproveDesc.innerHTML;
        btnAiImproveDesc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
        btnAiImproveDesc.disabled = true;

        try {
            const improvedText = await callOpenAI([
                {
                    role: 'system',
                    content: 'Eres un redactor técnico experto en ingeniería y servicios generales para GEMSA. Tu trabajo es mejorar la ortografía, gramática, vocabulario y coherencia del texto proporcionado por el usuario. Debe sonar profesional, preciso y técnico. Mantén todos los detalles y datos fácticos intactos. Responde ÚNICAMENTE con el texto corregido, sin explicaciones ni saludos.'
                },
                { role: 'user', content: desc }
            ]);

            fieldDescription.value = improvedText;
            reportData.description = improvedText;
            updatePreview();
            autosaveCurrentState();
            showToast("Descripción mejorada con IA");
        } catch (error) {
            console.error("Improve description failed:", error);
            showToast(`Error: ${error.message}`, true);
        } finally {
            btnAiImproveDesc.innerHTML = originalBtnText;
            btnAiImproveDesc.disabled = false;
        }
    }

    async function handleExpandDescription() {
        const desc = fieldDescription.value.trim();
        const serviceTitle = fieldName.value.trim();
        if (!desc) {
            showToast("Escribe algunas palabras clave antes de expandir", true);
            return;
        }

        const originalBtnText = btnAiExpandDesc.innerHTML;
        btnAiExpandDesc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Expandiendo...';
        btnAiExpandDesc.disabled = true;

        try {
            const expandedText = await callOpenAI([
                {
                    role: 'system',
                    content: 'Eres un ingeniero técnico senior para GEMSA Servicios Generales. Tu tarea es expandir las notas breves o apuntes del usuario en una descripción técnica detallada, profesional y estructurada. Agrega la terminología técnica correcta, el procedimiento estándar y los aspectos de seguridad típicos para este tipo de servicio. Mantén un tono formal y objetivo. Responde ÚNICAMENTE con el texto final generado, sin introducciones ni comentarios.'
                },
                {
                    role: 'user',
                    content: `Servicio: ${serviceTitle || "Servicio General"}\nNotas iniciales:\n${desc}`
                }
            ]);

            fieldDescription.value = expandedText;
            reportData.description = expandedText;
            updatePreview();
            autosaveCurrentState();
            showToast("Descripción detallada generada con IA");
        } catch (error) {
            console.error("Expand description failed:", error);
            showToast(`Error: ${error.message}`, true);
        } finally {
            btnAiExpandDesc.innerHTML = originalBtnText;
            btnAiExpandDesc.disabled = false;
        }
    }

    async function handleGenerateConclusions() {
        const serviceTitle = fieldName.value.trim();
        const desc = fieldDescription.value.trim();
        
        if (!desc) {
            showToast("Se requiere la descripción técnica para deducir las conclusiones", true);
            return;
        }

        const originalBtnText = btnAiGenConclusions.innerHTML;
        btnAiGenConclusions.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
        btnAiGenConclusions.disabled = true;

        try {
            const resultText = await callOpenAI([
                {
                    role: 'system',
                    content: 'Eres un consultor técnico para GEMSA. Con base en la descripción del servicio técnico ejecutado, genera una lista profesional de Conclusiones claras y Recomendaciones preventivas/correctivas útiles para el cliente. Presenta las conclusiones bajo el título "CONCLUSIONES:" y las recomendaciones bajo el título "RECOMENDACIONES:", separadas por una línea en blanco. Cada punto debe ser directo, técnico y formal. Responde ÚNICAMENTE con el texto de conclusiones y recomendaciones, sin rodeos.'
                },
                {
                    role: 'user',
                    content: `Servicio Técnico: ${serviceTitle || "Servicio no especificado"}\n\nDescripción del Servicio:\n${desc}`
                }
            ]);

            fieldConclusions.value = resultText;
            reportData.conclusions = resultText;
            updatePreview();
            autosaveCurrentState();
            showToast("Conclusiones y Recomendaciones generadas con IA");
        } catch (error) {
            console.error("Generate conclusions failed:", error);
            showToast(`Error: ${error.message}`, true);
        } finally {
            btnAiGenConclusions.innerHTML = originalBtnText;
            btnAiGenConclusions.disabled = false;
        }
    }

    async function handleImproveConclusions() {
        const conclusions = fieldConclusions.value.trim();
        if (!conclusions) {
            showToast("Las conclusiones están vacías", true);
            return;
        }

        const originalBtnText = btnAiImproveConclusions.innerHTML;
        btnAiImproveConclusions.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
        btnAiImproveConclusions.disabled = true;

        try {
            const improvedText = await callOpenAI([
                {
                    role: 'system',
                    content: 'Mejora el estilo y la redacción de las conclusiones y recomendaciones proporcionadas. Mantén la estructura de viñetas, corrige la ortografía y asegúrate de que el tono sea sumamente formal y profesional. Responde ÚNICAMENTE con el texto corregido.'
                },
                { role: 'user', content: conclusions }
            ]);

            fieldConclusions.value = improvedText;
            reportData.conclusions = improvedText;
            updatePreview();
            autosaveCurrentState();
            showToast("Conclusiones mejoradas con IA");
        } catch (error) {
            console.error("Improve conclusions failed:", error);
            showToast(`Error: ${error.message}`, true);
        } finally {
            btnAiImproveConclusions.innerHTML = originalBtnText;
            btnAiImproveConclusions.disabled = false;
        }
    }

    // --- AI Event Listeners ---
    if (fieldApiKey) {
        fieldApiKey.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            localStorage.setItem('gemsa_openai_api_key', val);
            if (val) {
                updateStatusBadge('offline', 'Listo');
            } else {
                updateStatusBadge('offline', 'Sin configurar');
            }
        });
    }

    if (btnToggleApiKey && fieldApiKey) {
        btnToggleApiKey.addEventListener('click', () => {
            const icon = btnToggleApiKey.querySelector('i');
            if (fieldApiKey.type === 'password') {
                fieldApiKey.type = 'text';
                if (icon) icon.className = "fa-solid fa-eye-slash";
            } else {
                fieldApiKey.type = 'password';
                if (icon) icon.className = "fa-solid fa-eye";
            }
        });
    }

    if (btnTestConnection) {
        btnTestConnection.addEventListener('click', testOpenAIConnection);
    }

    if (btnAiImproveDesc) {
        btnAiImproveDesc.addEventListener('click', handleImproveDescription);
    }

    if (btnAiExpandDesc) {
        btnAiExpandDesc.addEventListener('click', handleExpandDescription);
    }

    if (btnAiGenConclusions) {
        btnAiGenConclusions.addEventListener('click', handleGenerateConclusions);
    }

    if (btnAiImproveConclusions) {
        btnAiImproveConclusions.addEventListener('click', handleImproveConclusions);
    }

    // Window global reference for describePhotoWithAI so dynamic buttons can access it
    window.describePhotoWithAI = describePhotoWithAI;

    // --- App Start ---
    initApiKeyUI();
    loadAutosave();
    renderDraftsList();
});
