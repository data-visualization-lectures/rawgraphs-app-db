import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import { BsCloudDownload, BsTrash } from 'react-icons/bs';
import { getProjects, loadProject, deleteProject, loadThumbnail } from '../../../utils/cloudApi';
import dayjs from 'dayjs';
import { deserializeProject } from '@rawgraphs/rawgraphs-core';
import charts from '../../../charts';  // Import available charts configuration

// Sub-component for individual project card
function ProjectCard({ project, onLoad, onDelete }) {
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [loadingThumb, setLoadingThumb] = useState(false);

    useEffect(() => {
        let active = true;

        async function fetchThumb() {
            if (!project.thumbnail_path) return;
            setLoadingThumb(true);
            try {
                const url = await loadThumbnail(project.id);
                if (active && url) {
                    setThumbnailUrl(url);
                }
            } catch (e) {
                console.warn("Failed to load thumbnail for", project.name, e);
            } finally {
                if (active) setLoadingThumb(false);
            }
        }

        fetchThumb();

        return () => {
            active = false;
        };
    }, [project.thumbnail_path, project.name]);
    // project.name included to verify identity if needed, but path is enough.

    // Cleanup blob URL on unmount
    useEffect(() => {
        return () => {
            if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        };
    }, [thumbnailUrl]);

    return (
        <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
            <Card className="h-100 shadow-sm">
                <div
                    style={{
                        height: '150px',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderBottom: '1px solid #eee'
                    }}
                >
                    {loadingThumb && <Spinner animation="border" size="sm" variant="secondary" />}
                    {!loadingThumb && thumbnailUrl && (
                        <Card.Img
                            variant="top"
                            src={thumbnailUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    {!loadingThumb && !thumbnailUrl && (
                        <span className="text-muted small">No Preview</span>
                    )}
                </div>
                <Card.Body className="d-flex flex-column">
                    <Card.Title style={{ fontSize: '1rem', fontWeight: 'bold' }} className="text-truncate" title={project.name}>
                        {project.name}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-auto">
                        Updated: {dayjs(project.updated_at).format('YYYY-MM-DD HH:mm')}
                    </Card.Text>

                    <div className="d-flex justify-content-between mt-3">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onLoad(project.id)}
                            className="flex-grow-1 mr-2"
                        >
                            <BsCloudDownload /> 開く
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onDelete(project.id)}
                            title="削除"
                        >
                            <BsTrash />
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
}

export default function LoadCloudProject({ onProjectSelected, setLoadingError }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
            setError('プロジェクト一覧の取得に失敗しました。ログイン状態を確認してください。');
            setLoadingError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoadingError]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleLoad = async (id) => {
        setLoading(true);
        try {
            const projectData = await loadProject(id);

            // cloudApi returns the JSON object directly.
            // We need to pass it through deserializeProject to ensure it's fully hydrated
            const jsonString = JSON.stringify(projectData);
            const project = deserializeProject(jsonString, charts);

            if (!project.userData && project.rawData) {
                project.userData = project.rawData;
            }

            onProjectSelected(project);
        } catch (err) {
            console.error(err);
            setError('プロジェクトの読み込みに失敗しました。');
            setLoadingError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('本当にこのプロジェクトを削除しますか？')) return;

        // Optimistic update or waiting? Let's wait.
        // But we shouldn't block the UI too much, but deletion is fast.
        // We can just show global loading or a small toast.
        // For now, reuse global loading but it might clear the list view which is jarring.
        // Let's keep it simple.
        setLoading(true);
        try {
            await deleteProject(id);
            await fetchProjects(); // Refresh list
        } catch (err) {
            console.error(err);
            setError('削除に失敗しました。');
            setLoading(false);
        }
    }

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">サーバからプロジェクトを開く</h4>
                <Button variant="link" size="sm" onClick={fetchProjects} disabled={loading}>
                    {loading ? '更新中...' : '一覧更新'}
                </Button>
            </div>

            <p className="text-muted small">プロジェクトを選択してください。</p>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading && projects.length === 0 && (
                <div className="text-center my-5"><Spinner animation="border" /></div>
            )}

            {!loading && projects.length === 0 && (
                <Alert variant="info">保存されたプロジェクトはありません。</Alert>
            )}

            <Row>
                {projects.map((p) => (
                    <ProjectCard
                        key={p.id}
                        project={p}
                        onLoad={handleLoad}
                        onDelete={handleDelete}
                    />
                ))}
            </Row>
        </div>
    );
}
