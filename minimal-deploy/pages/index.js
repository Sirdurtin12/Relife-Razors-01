export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Relife Razor - Base de données de rasoirs traditionnels
      </h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
        Site en cours de déploiement. Notre application de référence sur les rasoirs et leur échelle de douceur sera bientôt disponible !
      </p>
      <div style={{ 
        padding: '1rem', 
        border: '1px solid #ccc', 
        borderRadius: '0.5rem',
        background: '#f9f9f9',
        maxWidth: '500px'
      }}>
        <h2 style={{ color: '#4f46e5', marginBottom: '1rem' }}>Échelle de douceur</h2>
        <p>Notre échelle de 1 à 20 permet d'évaluer la douceur des rasoirs :</p>
        <ul style={{ textAlign: 'left', listStyleType: 'none', padding: '0.5rem' }}>
          <li style={{ padding: '0.25rem', backgroundColor: '#fff176', margin: '0.25rem 0', borderRadius: '0.25rem' }}>
            <span style={{ fontWeight: 'bold' }}>1-3:</span> Très doux
          </li>
          <li style={{ padding: '0.25rem', backgroundColor: '#f9bd59', margin: '0.25rem 0', borderRadius: '0.25rem' }}>
            <span style={{ fontWeight: 'bold' }}>4-7:</span> Doux
          </li>
          <li style={{ padding: '0.25rem', backgroundColor: '#e8863b', margin: '0.25rem 0', borderRadius: '0.25rem' }}>
            <span style={{ fontWeight: 'bold' }}>8-12:</span> Intermédiaire
          </li>
          <li style={{ padding: '0.25rem', backgroundColor: '#d03c1f', margin: '0.25rem 0', borderRadius: '0.25rem', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>13-17:</span> Agressif
          </li>
          <li style={{ padding: '0.25rem', backgroundColor: '#7e0404', margin: '0.25rem 0', borderRadius: '0.25rem', color: 'white' }}>
            <span style={{ fontWeight: 'bold' }}>18-20:</span> Très agressif
          </li>
        </ul>
      </div>
      <footer style={{ 
        marginTop: '2rem',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        © 2025 Relife Razor - Tous droits réservés
      </footer>
    </div>
  )
}
