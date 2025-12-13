
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Table, Spinner, Alert } from 'react-bootstrap';
import { BsCloudDownload, BsTrash } from 'react-icons/bs';
import { getProjects, loadProject, deleteProject } from '../../../utils/cloudApi';
import dayjs from 'dayjs';

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
            onProjectSelected(projectData);
        } catch (err) {
            console.error(err);
            setError('プロジェクトの読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('本当にこのプロジェクトを削除しますか？')) return;

        setLoading(true);
        try {
            await deleteProject(id);
            await fetchProjects(); // Refresh list
        } catch (err) {
            console.error(err);
            setError('削除に失敗しました。');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-3">
            <h4>クラウドからプロジェクトを開く</h4>
            <p className="text-muted small">保存されたプロジェクトを選択してください。</p>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading && <div className="text-center my-3"><Spinner animation="border" /></div>}

            {!loading && projects.length === 0 && (
                <p>保存されたプロジェクトはありません。</p>
            )}

            {!loading && projects.length > 0 && (
                <Table hover size="sm">
                    <thead>
                        <tr>
                            <th>プロジェクト名</th>
                            <th>更新日</th>
                            <th className="text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p) => (
                            <tr key={p.id}>
                                <td className="align-middle">{p.name}</td>
                                <td className="align-middle">{dayjs(p.updated_at).format('YYYY-MM-DD HH:mm')}</td>
                                <td className="text-right">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleLoad(p.id)}
                                    >
                                        <BsCloudDownload /> 開く
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(p.id)}
                                    >
                                        <BsTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <div className="text-right">
                <Button variant="link" size="sm" onClick={fetchProjects}>更新</Button>
            </div>
        </div>
    );
}
