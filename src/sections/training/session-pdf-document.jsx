import { Text, View, Page, Image, Document, StyleSheet } from '@react-pdf/renderer';

// ----------------------------------------------------------------------
// Lazy-loaded on export click only (see session-new-edit-form.jsx) so
// @react-pdf/renderer never ships in the main bundle.

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 20, marginBottom: 8, fontWeight: 700 },
  meta: { fontSize: 10, color: '#555555', marginBottom: 2 },
  metaBlock: { marginTop: 16 },
  exerciseTitle: { fontSize: 14, marginBottom: 6, fontWeight: 700 },
  instructions: { fontSize: 10, color: '#333333', marginBottom: 10 },
  image: { width: '100%', maxHeight: 420, objectFit: 'contain' },
  noImage: { fontSize: 10, color: '#999999', fontStyle: 'italic' },
});

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export function SessionPdfDocument({ session, items }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{session.title || 'Sesión de entrenamiento'}</Text>
        <View style={styles.metaBlock}>
          {!!session.date && <Text style={styles.meta}>{formatDate(session.date)}</Text>}
          {!!session.location && <Text style={styles.meta}>{session.location}</Text>}
          {!!session.teamGroup && <Text style={styles.meta}>{session.teamGroup}</Text>}
          {!!session.objective && <Text style={styles.meta}>{session.objective}</Text>}
          <Text style={styles.meta}>{`${items.length} ejercicio(s)`}</Text>
        </View>
      </Page>

      {items.map(({ exercise, dataUrl }, index) => (
        <Page key={exercise.id} size="A4" style={styles.page}>
          <Text style={styles.exerciseTitle}>
            {`Ejercicio ${index + 1}${exercise.name ? ` — ${exercise.name}` : ''}${
              exercise.durationMinutes ? ` (${exercise.durationMinutes} min)` : ''
            }`}
          </Text>
          {!!exercise.instructions && <Text style={styles.instructions}>{exercise.instructions}</Text>}
          {dataUrl ? (
            <Image src={dataUrl} style={styles.image} />
          ) : (
            <Text style={styles.noImage}>Sin diagrama</Text>
          )}
        </Page>
      ))}
    </Document>
  );
}
