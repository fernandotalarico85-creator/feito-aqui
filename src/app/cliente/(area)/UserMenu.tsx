import UserMenuDropdown, { UserMenuLink } from "@/components/UserMenuDropdown";

/**
 * Menu do usuário logado (Prompt 15) — mesmo padrão do dropdown do worker (Prompt 12),
 * só que com "Meu Perfil" e "Sair", sem "Portfólio" (exclusivo do worker).
 */
export default function UserMenu({
  nome,
  sairAction,
}: {
  nome: string;
  sairAction: (formData: FormData) => void;
}) {
  return (
    <UserMenuDropdown label={nome}>
      <UserMenuLink href="/cliente/perfil">Meu Perfil</UserMenuLink>
      <form action={sairAction}>
        <button
          type="submit"
          className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
        >
          Sair
        </button>
      </form>
    </UserMenuDropdown>
  );
}
