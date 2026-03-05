
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { saveProject } from '../../utils/cloudApi';

function getDefaultName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function CloudSaveModal({ show, onHide, getProjectData, getThumbnailBlob }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    useEffect(() => {
        if (show) {
            setName(getDefaultName());
        }
    }, [show]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const projectData = getProjectData(); // This should return the JSON
            const thumbnailBlob = await getThumbnailBlob(); // Generate Thumbnail
            await saveProject(projectData, name, thumbnailBlob);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onHide();
                setName(''); // Reset name
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(t('cloudSave.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('cloudSave.title')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{t('cloudSave.success')}</Alert>}

                <Form>
                    <Form.Group>
                        <Form.Label>{t('cloudSave.projectName')}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={t('cloudSave.placeholder')}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={loading || success}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    {t('cloudSave.cancel')}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading || success || !name.trim()}>
                    {loading ? <Spinner animation="border" size="sm" /> : t('cloudSave.save')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
